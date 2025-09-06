import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_key, recipient_email, recipient_name, template_data, priority } = body

    if (!template_key || !recipient_email || !template_data) {
      return NextResponse.json(
        { error: "Missing required fields: template_key, recipient_email, template_data" },
        { status: 400 },
      )
    }

    const emailId = await emailService.queueEmail({
      template_key,
      recipient_email,
      recipient_name,
      template_data,
      priority,
    })

    return NextResponse.json({
      success: true,
      email_id: emailId,
      message: "Email queued successfully",
    })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
