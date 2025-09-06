import { NextResponse } from "next/server"

// Force Node.js runtime to avoid unenv limitations
export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("Starting email connection test...")

    // Dynamic import to avoid edge runtime issues
    const { emailServerService } = await import("@/lib/email-server")

    const success = await emailServerService.testConnection()

    console.log("Connection test result:", success)

    return NextResponse.json({
      success,
      message: success ? "Email connection successful" : "Email connection failed",
    })
  } catch (error) {
    console.error("Connection test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
