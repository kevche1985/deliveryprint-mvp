import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, message } = body

    if (!to) {
      return NextResponse.json({ success: false, error: "Recipient email is required" }, { status: 400 })
    }

    const messageId = await emailService.sendTestEmail(
      to,
      subject || "Test Email from DeliveryPrint",
      message || "This is a test email to verify your email configuration is working correctly.",
    )

    return NextResponse.json({
      success: true,
      messageId,
      message: `Test email sent successfully to ${to}`,
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 },
    )
  }
}
