import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { productId, formats } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get the digital product
    const { data: product, error: productError } = await supabase
      .from("digital_products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Create service role client for signed URLs
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Generate signed URLs for download
    const downloadLinks = []
    const requestedFormats = formats || ["original"]

    for (const format of requestedFormats) {
      // Extract file path from the full URL
      const urlParts = product.download_url.split("/")
      const bucketIndex = urlParts.findIndex((part) => part === "digital-products")
      const filePath = urlParts.slice(bucketIndex + 1).join("/")

      // Generate signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabaseService.storage
        .from("digital-products")
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError)
        continue
      }

      downloadLinks.push({
        format,
        signedUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        downloadsRemaining: 10,
      })
    }

    return NextResponse.json({
      success: true,
      productId,
      downloadLinks,
    })
  } catch (error: any) {
    console.error("Error generating download links:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
