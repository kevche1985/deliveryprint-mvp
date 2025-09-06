import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection with authentication...")

    // Test 1: Check if we can connect to Supabase
    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase client not initialized",
          tests: {
            supabase_client: false,
            auth_session: false,
            table_exists: false,
            can_query: false,
          },
        },
        { status: 500 },
      )
    }

    const tests = {
      supabase_client: true,
      auth_session: false,
      table_exists: false,
      can_query: false,
    }

    // Test 2: Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        {
          success: false,
          error: `Session error: ${sessionError.message}`,
          tests,
        },
        { status: 401 },
      )
    }

    if (session?.user) {
      tests.auth_session = true
      console.log("User authenticated:", session.user.id)
    } else {
      console.log("No authenticated user")
      return NextResponse.json(
        {
          success: false,
          error: "No authenticated user",
          tests,
          message: "Please log in first",
        },
        { status: 401 },
      )
    }

    // Test 3: Check if table exists and is accessible
    try {
      const { data: tableData, error: tableError } = await supabase.from("digital_products").select("id").limit(1)

      if (tableError) {
        console.error("Table query error:", tableError)

        // Provide specific error messages based on the error type
        if (tableError.message.includes("relation") && tableError.message.includes("does not exist")) {
          return NextResponse.json(
            {
              success: false,
              error: "Table 'digital_products' does not exist",
              tests,
              details: tableError,
              suggestion: "Please run the database migration: supabase/migrations/create_digital_products_simple.sql",
            },
            { status: 500 },
          )
        }

        if (tableError.message.includes("permission denied")) {
          return NextResponse.json(
            {
              success: false,
              error: "Permission denied - RLS policies may not be configured correctly",
              tests,
              details: tableError,
              suggestion: "Please check RLS policies for the digital_products table or run the migration",
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          {
            success: false,
            error: `Table error: ${tableError.message}`,
            tests,
            details: tableError,
          },
          { status: 500 },
        )
      }

      tests.table_exists = true
      console.log("Table exists and is accessible")

      // Test 4: Try to query user's data
      const { data: userData, error: queryError } = await supabase
        .from("digital_products")
        .select("*")
        .eq("user_id", session.user.id)
        .limit(5)

      if (queryError) {
        console.error("Query error:", queryError)
        return NextResponse.json(
          {
            success: false,
            error: `Query error: ${queryError.message}`,
            tests,
            details: queryError,
          },
          { status: 500 },
        )
      }

      tests.can_query = true

      // Test 5: Try to get count of records using a simpler method
      let totalCount = 0
      try {
        const { data: countData, error: countError } = await supabase
          .from("digital_products")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)

        if (!countError && countData !== null) {
          // The count is returned in the response headers, not the data
          totalCount = 0 // We'll get this from the response metadata
        }
      } catch (countErr) {
        console.log("Count query failed, but that's okay")
      }

      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        tests,
        user_id: session.user.id,
        user_email: session.user.email,
        data_count: userData?.length || 0,
        total_count: totalCount,
        sample_data: userData?.slice(0, 2) || [],
        environment: {
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
          supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
        },
      })
    } catch (error: any) {
      console.error("Database test error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Database test failed: ${error.message}`,
          tests,
          stack: error.stack,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Test endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Test failed: ${error.message}`,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
