import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const { searchParams } = new URL(request.url)
    const requestedFormat = searchParams.get('format')?.toUpperCase() || 'PNG'

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

    // Get the digital product
    const { data: product, error: productError } = await supabase
      .from("digital_products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 })
    }

    // For free generated content, allow download immediately
    // For paid content, check if it's been purchased
    if (product.base_price > 0 && product.status !== "purchased") {
      return NextResponse.json({ error: "Product not purchased" }, { status: 403 })
    }

    // Get the download URL - prefer download_url, fallback to preview_url
    const downloadUrl = product.download_url || product.preview_url

    if (!downloadUrl) {
      return NextResponse.json({ error: "Download URL not available" }, { status: 404 })
    }

    try {
      // Create service role client for file access
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

      // Extract file path from the full URL
      const urlParts = downloadUrl.split("/")
      const bucketIndex = urlParts.findIndex((part: string) => part === "digital-products")

      if (bucketIndex === -1) {
        // If it's not a Supabase storage URL, try to fetch directly
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch file")
        }

        const fileBuffer = await response.arrayBuffer()
        const contentType = response.headers.get("content-type") || "application/octet-stream"

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${product.name}.${requestedFormat.toLowerCase()}"`,
            "Cache-Control": "no-cache",
          },
        })
      }

      const filePath = urlParts.slice(bucketIndex + 1).join("/")

      // Download file from Supabase storage
      const { data: fileData, error: downloadError } = await supabaseService.storage
        .from("digital-products")
        .download(filePath)

      if (downloadError) {
        console.error("Error downloading from storage:", downloadError)
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
      }

      // Convert blob to array buffer
      const fileBuffer = await fileData.arrayBuffer()

      // Determine content type from file extension or metadata
      const fileExtension = filePath.split(".").pop()?.toLowerCase()
      let contentType = "application/octet-stream"

      switch (fileExtension) {
        case "png":
          contentType = "image/png"
          break
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg"
          break
        case "svg":
          contentType = "image/svg+xml"
          break
        case "pdf":
          contentType = "application/pdf"
          break
      }

      // Return the file
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${product.name}.${requestedFormat.toLowerCase()}"`,
          "Cache-Control": "no-cache",
        },
      })
    } catch (fileError) {
      console.error("Error processing file download:", fileError)
      return NextResponse.json({ error: "Failed to process download" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in download API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
