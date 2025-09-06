import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Supabase environment variables",
          environment: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "✓ Set" : "✗ Missing",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "✓ Set" : "✗ Missing",
          },
        },
        { status: 500 },
      )
    }

    // Create a fresh Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test basic connection by trying to query a simple table
    try {
      // First, try to check if digital_products table exists by querying it
      const { data: digitalProductsTest, error: digitalProductsError } = await supabase
        .from("digital_products")
        .select("id")
        .limit(1)

      let tableExists = false
      let tableError = null

      if (digitalProductsError) {
        // Check if it's a "table doesn't exist" error vs other errors
        if (
          digitalProductsError.message.includes("relation") &&
          digitalProductsError.message.includes("does not exist")
        ) {
          tableExists = false
          tableError = "Table does not exist"
        } else if (digitalProductsError.message.includes("permission denied")) {
          tableExists = true // Table exists but we don't have permission
          tableError = "Permission denied - RLS policies may need configuration"
        } else {
          tableExists = false
          tableError = digitalProductsError.message
        }
      } else {
        tableExists = true
        tableError = null
      }

      // Alternative method: Use pg_tables system catalog if available
      let systemTableCheck = null
      try {
        const { data: pgTablesData, error: pgTablesError } = await supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")
          .eq("tablename", "digital_products")
          .limit(1)

        if (!pgTablesError && pgTablesData) {
          systemTableCheck = pgTablesData.length > 0 ? "✓ Found via pg_tables" : "✗ Not found via pg_tables"
        } else {
          systemTableCheck = "pg_tables not accessible"
        }
      } catch (pgError) {
        systemTableCheck = "pg_tables query failed"
      }

      return NextResponse.json({
        success: !digitalProductsError || tableExists,
        message: tableExists ? "Database connection successful" : "Database connection has issues",
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: "✓ Set",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "✓ Set",
        },
        database: {
          connection: "✓ Working",
          digital_products_table: tableExists ? "✓ Exists" : "✗ Missing or No Access",
          table_error: tableError,
          system_table_check: systemTableCheck,
        },
        debug: {
          original_error: digitalProductsError?.message || null,
          error_code: digitalProductsError?.code || null,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (dbError: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Database query failed: ${dbError.message}`,
          environment: {
            NEXT_PUBLIC_SUPABASE_URL: "✓ Set",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "✓ Set",
          },
          database: {
            connection: "✗ Failed",
            error_details: dbError.message,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: `System error: ${error.message}`,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
