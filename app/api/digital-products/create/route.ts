import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Digital Products Create API Called ===")

    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Authentication error:", authError)
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: authError.message,
          code: "AUTH_ERROR",
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.error("No user found")
      return NextResponse.json(
        {
          error: "User not authenticated",
          code: "NO_USER",
        },
        { status: 401 },
      )
    }

    console.log("User authenticated:", user.id)

    let body
    try {
      body = await request.json()
      console.log("Request body parsed successfully")
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 },
      )
    }

    const { id, type, name, description, file_data, generation_inputs, base_price, preview_url } = body

    // Validate required fields
    if (!id || !type || !name || !file_data) {
      console.error("Missing required fields:", {
        id: !!id,
        type: !!type,
        name: !!name,
        file_data: !!file_data,
      })
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["id", "type", "name", "file_data"],
          received: { id: !!id, type: !!type, name: !!name, file_data: !!file_data },
          code: "MISSING_FIELDS",
        },
        { status: 400 },
      )
    }

    // Validate type
    const validTypes = ["logo", "image", "font", "custom_design"]
    if (!validTypes.includes(type)) {
      console.error("Invalid type:", type)
      return NextResponse.json(
        {
          error: "Invalid type",
          validTypes,
          received: type,
          code: "INVALID_TYPE",
        },
        { status: 400 },
      )
    }

    // Set default base price based on type
    let defaultPrice = base_price
    if (!defaultPrice) {
      switch (type) {
        case "logo":
          defaultPrice = 9.99
          break
        case "font":
          defaultPrice = 14.99
          break
        case "image":
        case "custom_design":
          defaultPrice = 4.99
          break
        default:
          defaultPrice = 4.99
      }
    }

    const insertData = {
      id,
      user_id: user.id,
      type,
      name,
      description: description || `Custom ${type}`,
      file_data,
      generation_inputs: generation_inputs || {},
      base_price: defaultPrice,
      status: "unpurchased",
      preview_url: preview_url || null,
    }

    console.log("Attempting to insert digital product:", {
      id: insertData.id,
      user_id: insertData.user_id,
      type: insertData.type,
      name: insertData.name,
      base_price: insertData.base_price,
    })

    // First, check if table exists by trying a simple query
    try {
      const { error: tableCheckError } = await supabase.from("digital_products").select("id").limit(1)

      if (tableCheckError) {
        console.error("Table check failed:", tableCheckError)
        return NextResponse.json(
          {
            error: "Database table not accessible",
            message: tableCheckError.message,
            code: tableCheckError.code,
            hint: "The digital_products table may not exist or you may not have permission to access it",
            suggestion: "Please run the database migration: supabase/migrations/ensure_digital_products_table.sql",
          },
          { status: 500 },
        )
      }
    } catch (tableError) {
      console.error("Table existence check failed:", tableError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: tableError instanceof Error ? tableError.message : "Unknown error",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 500 },
      )
    }

    // Insert the digital product
    const { data, error } = await supabase.from("digital_products").insert(insertData).select().single()

    if (error) {
      console.error("Database error creating digital product:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // Provide specific error messages based on error codes
      let userMessage = "Failed to create digital product"
      let suggestion = ""

      switch (error.code) {
        case "23505": // unique_violation
          userMessage = "A product with this ID already exists"
          suggestion = "Please try again"
          break
        case "23503": // foreign_key_violation
          userMessage = "User reference is invalid"
          suggestion = "Please log in again"
          break
        case "42501": // insufficient_privilege
          userMessage = "Permission denied"
          suggestion = "You don't have permission to create digital products"
          break
        case "42P01": // undefined_table
          userMessage = "Database table not found"
          suggestion = "Please contact support - database setup incomplete"
          break
        default:
          userMessage = error.message || "Database error occurred"
      }

      return NextResponse.json(
        {
          error: userMessage,
          code: error.code,
          details: error.details,
          suggestion,
          technical_details: {
            message: error.message,
            hint: error.hint,
          },
        },
        { status: 500 },
      )
    }

    console.log("Successfully created digital product:", data.id)
    return NextResponse.json({
      success: true,
      product: data,
    })
  } catch (error) {
    console.error("Unexpected error in digital products create route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
        suggestion: "Please try again or contact support if the problem persists",
      },
      { status: 500 },
    )
  }
}
