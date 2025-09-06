import { NextResponse } from "next/server"

// Mock digital products data
const mockProducts = [
  {
    id: "logo-1",
    type: "logo",
    name: "Business Logo",
    description: "Professional vector logo for your business",
    basePrice: 9.99,
    previewUrl: "/placeholder.svg?height=300&width=300",
    status: "active",
  },
  {
    id: "image-1",
    type: "image",
    name: "Product Showcase",
    description: "High-quality product showcase image",
    basePrice: 4.99,
    previewUrl: "/placeholder.svg?height=300&width=300",
    status: "active",
  },
  {
    id: "font-1",
    type: "font",
    name: "Modern Sans",
    description: "Clean, modern sans-serif font family",
    basePrice: 14.99,
    previewUrl: "/placeholder.svg?height=300&width=300",
    status: "active",
  },
]

export async function GET() {
  try {
    // Return mock data for now
    return NextResponse.json({ products: mockProducts })
  } catch (error) {
    console.error("Error in digital products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Just return the submitted data with a mock ID
    return NextResponse.json({
      product: {
        ...body,
        id: `product-${Date.now()}`,
        status: "generated",
      },
    })
  } catch (error) {
    console.error("Error in digital products POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
