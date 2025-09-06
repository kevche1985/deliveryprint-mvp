import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: {
          url: supabaseUrl ? "✓" : "✗",
          key: supabaseAnonKey ? "✓" : "✗",
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Simple test: try to query the digital_products table
    const { data, error } = await supabase.from("digital_products").select("id").limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        error_code: error.code,
        hint: error.hint,
        details: error.details,
        suggestion: error.message.includes("does not exist")
          ? "Run the migration: supabase/migrations/create_digital_products_simple.sql"
          : error.message.includes("permission denied")
            ? "Check RLS policies or run the migration"
            : "Check your Supabase configuration",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection working",
      table_accessible: true,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      type: "Connection error",
    })
  }
}
