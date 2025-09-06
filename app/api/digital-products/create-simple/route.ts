import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory storage for testing
const memoryStorage: Record<string, any> = {}

export async function POST(request: NextRequest) {
  console.log("=== Digital Products Create Simple API Called ===")

  try {
    // Parse request body
    let body
    try {
      const text = await request.text()
      console.log(`Request body size: ${text.length} characters`)

      // Check if the payload is too large
      if (text.length > 5 * 1024 * 1024) {
        // 5MB limit
        return NextResponse.json(
          {
            error: "Payload too large",
            details: "The request payload exceeds the 5MB limit",
          },
          { status: 413 },
        )
      }

      body = JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    // Extract and validate fields
    const { id, type, name, file_data } = body

    if (!id || !type || !name) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["id", "type", "name"],
          received: { id: !!id, type: !!type, name: !!name },
        },
        { status: 400 },
      )
    }

    // Create a simplified product object
    const product = {
      id,
      user_id: "anonymous",
      type,
      name,
      description: body.description || `Custom ${type}`,
      // Store minimal data to avoid memory issues
      file_data: {
        formats: file_data?.formats || ["png"],
        design_data: {
          timestamp: Date.now(),
          elements: file_data?.design_data?.elements?.length || 0,
        },
      },
      base_price: body.base_price || 4.99,
      status: "unpurchased",
      created_at: new Date().toISOString(),
    }

    // Store in memory
    memoryStorage[id] = product

    console.log("Successfully created simple digital product:", id)

    return NextResponse.json({
      success: true,
      product: product,
    })
  } catch (error) {
    console.error("Unexpected error in simple digital products create route:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Add a GET method to retrieve stored products (for testing)
export async function GET() {
  return NextResponse.json({
    products: Object.keys(memoryStorage).map((id) => ({
      id,
      name: memoryStorage[id].name,
      type: memoryStorage[id].type,
      created_at: memoryStorage[id].created_at,
    })),
  })
}
