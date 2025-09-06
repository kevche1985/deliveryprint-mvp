import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, message: "Settings are required" }, { status: 400 })
    }

    const result = await emailService.testConnection(settings)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 },
    )
  }
}
