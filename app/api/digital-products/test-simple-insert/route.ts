import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  console.log("🧪 Testing simple digital product insert...")

  try {
    // Get content length first
    const contentLength = request.headers.get("content-length")
    console.log("📏 Content-Length header:", contentLength)

    // Try to read the request body as text first
    let requestText: string
    try {
      requestText = await request.text()
      console.log("📄 Request body length:", requestText.length, "characters")
      console.log("📄 Request body preview:", requestText.substring(0, 200) + "...")
    } catch (textError) {
      console.error("❌ Failed to read request text:", textError)
      return NextResponse.json({ error: "Failed to read request body" }, { status: 400 })
    }

    // Try to parse JSON
    let requestData: any
    try {
      requestData = JSON.parse(requestText)
      console.log("✅ JSON parsed successfully")
      console.log("📦 Request data keys:", Object.keys(requestData))
    } catch (jsonError) {
      console.error("❌ JSON parse error:", jsonError)
      console.error("❌ First 500 chars of request:", requestText.substring(0, 500))
      return NextResponse.json(
        {
          error: "Invalid JSON",
          details: jsonError instanceof Error ? jsonError.message : "Unknown JSON error",
          preview: requestText.substring(0, 200),
        },
        { status: 400 },
      )
    }

    // Get auth header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Get user from token
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Authentication failed:", authError?.message)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ User authenticated:", user.id)

    // Create service role client
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

    // Try a simple insert with minimal data
    const testData = {
      user_id: user.id,
      type: "image",
      name: `Test Insert ${Date.now()}`,
      description: "Simple test insert",
      base_price: 0,
      generation_inputs: { test: true },
      generated_content: { test: true },
      preview_url: "https://example.com/test.png",
      download_url: "https://example.com/test.png",
      metadata: { test: true },
      status: "unpurchased",
    }

    console.log("💾 Attempting simple insert...")

    const { data: product, error: insertError } = await supabaseService
      .from("digital_products")
      .insert([testData])
      .select()
      .single()

    if (insertError) {
      console.error("❌ Insert error:", insertError)
      return NextResponse.json(
        {
          error: "Database insert failed",
          details: insertError,
        },
        { status: 500 },
      )
    }

    console.log("✅ Simple insert successful:", product.id)

    // Clean up test record
    await supabaseService.from("digital_products").delete().eq("id", product.id)

    console.log("🧹 Test record cleaned up")

    return NextResponse.json({
      success: true,
      message: "Simple insert test passed",
      product_id: product.id,
      request_size: requestText.length,
      user_id: user.id,
    })
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
