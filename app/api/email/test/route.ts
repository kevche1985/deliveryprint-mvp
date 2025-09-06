import { NextResponse } from "next/server"

// Force Node.js runtime to avoid unenv limitations
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { recipient_email } = await request.json()

    if (!recipient_email) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient email is required",
        },
        { status: 400 },
      )
    }

    // Dynamic import to avoid edge runtime issues
    const { emailServerService } = await import("@/lib/email-server")

    const success = await emailServerService.sendEmail({
      template_key: "test_email",
      recipient_email,
      template_data: {
        test_message: "This is a test email to verify your email configuration is working correctly.",
        timestamp: new Date().toLocaleString(),
        admin_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/email-settings`,
      },
    })

    return NextResponse.json({
      success,
      message: success ? "Test email sent successfully" : "Failed to send test email",
    })
  } catch (error) {
    console.error("Test email error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
