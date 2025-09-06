import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Testing Digital Products Database Connection ===")

    const supabase = createClient()

    // Test 1: Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        details: authError.message,
      })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No user authenticated",
      })
    }

    // Test 2: Check if digital_products table exists
    const { data: tableCheck, error: tableError } = await supabase.from("digital_products").select("count").limit(1)

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: "Table access failed",
        details: tableError.message,
        code: tableError.code,
        hint: tableError.hint,
      })
    }

    // Test 3: Try a simple insert (then delete)
    const testId = `test_${Date.now()}`
    const { data: insertData, error: insertError } = await supabase
      .from("digital_products")
      .insert({
        id: testId,
        user_id: user.id,
        type: "image",
        name: "Test Product",
        description: "Test description",
        file_data: { test: true },
        generation_inputs: {},
        base_price: 1.0,
        status: "unpurchased",
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: "Insert test failed",
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
      })
    }

    // Clean up test record
    await supabase.from("digital_products").delete().eq("id", testId)

    return NextResponse.json({
      success: true,
      message: "All tests passed",
      user_id: user.id,
      table_accessible: true,
      insert_successful: true,
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
