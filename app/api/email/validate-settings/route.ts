import { NextResponse } from "next/server"

// Force Node.js runtime to avoid unenv limitations
export const runtime = "nodejs"

export async function POST() {
  try {
    // Dynamic import to avoid edge runtime issues
    const { emailServerService } = await import("@/lib/email-server")

    const validation = await emailServerService.validateSettings()

    return NextResponse.json({
      success: validation.valid,
      errors: validation.errors,
      message: validation.valid ? "Settings are valid" : "Settings validation failed",
    })
  } catch (error) {
    console.error("Settings validation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Settings validation failed",
        details: error instanceof Error ? error.message : "Unknown error",
        errors: ["Failed to validate settings"],
      },
      { status: 500 },
    )
  }
}
