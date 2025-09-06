import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  console.log("🧪 Testing digital product creation...")

  try {
    // Get auth token from headers
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
    }

    // Create Supabase client for user authentication
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

    // Create service role client for database operations
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

    // Create a simple test record
    const testData = {
      user_id: user.id,
      type: "image",
      name: `Test Design ${new Date().toISOString()}`,
      description: "Test design created via API",
      base_price: 10.0,
      generation_inputs: JSON.stringify({ test: true }),
      generated_content: JSON.stringify({ test_content: "sample" }),
      preview_url: "https://example.com/preview.png",
      download_url: "https://example.com/download.png",
      metadata: JSON.stringify({ test_metadata: true }),
      status: "unpurchased",
    }

    console.log("💾 Inserting test data:", {
      user_id: testData.user_id,
      type: testData.type,
      name: testData.name,
    })

    // Insert the test record
    const { data: product, error: insertError } = await supabaseService
      .from("digital_products")
      .insert([testData])
      .select()
      .single()

    if (insertError) {
      console.error("❌ Insert error:", insertError)
      return NextResponse.json(
        {
          error: `Failed to create test product: ${insertError.message}`,
          details: insertError,
        },
        { status: 500 },
      )
    }

    console.log("✅ Test product created successfully:", product.id)

    return NextResponse.json({
      success: true,
      product: product,
      message: "Test digital product created successfully",
    })
  } catch (error: any) {
    console.error("💥 Test error:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
