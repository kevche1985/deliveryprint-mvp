import { type NextRequest, NextResponse } from "next/server"
import { storeDigitalProduct } from "@/lib/digital-product-service"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("Store digital product API called")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Try to get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("User from auth:", user?.id || "No user")
    console.log("Auth error:", authError?.message || "No error")

    if (authError || !user) {
      console.log("Authentication failed")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { productType, name, imageUrl, description, generationParams } = body

    console.log("Request body:", { productType, name, imageUrl: imageUrl?.substring(0, 50) + "..." })

    if (!productType || !name || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields: productType, name, imageUrl" }, { status: 400 })
    }

    const result = await storeDigitalProduct(user.id, productType, name, imageUrl, description, generationParams)

    if (!result) {
      return NextResponse.json({ error: "Failed to store digital product" }, { status: 500 })
    }

    console.log("Digital product stored successfully:", result.id)
    return NextResponse.json({ success: true, product: result })
  } catch (error: any) {
    console.error("Error in store digital product API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
