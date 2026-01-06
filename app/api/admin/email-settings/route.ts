import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"
import { requireRole } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "operator"])
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    console.log("GET /api/admin/email-settings - Fetching email settings...")

    const settings = await emailService.getSettings()

    console.log("Email settings fetched successfully:", settings)

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error fetching email settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch email settings",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "operator"])
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    console.log("POST /api/admin/email-settings - Updating email settings...")

    const body = await request.json()
    const { emailSettings } = body

    if (!emailSettings) {
      return NextResponse.json({ success: false, error: "Email settings are required" }, { status: 400 })
    }

    console.log("Updating email settings:", emailSettings)

    // Map is_active to email_enabled for consistency
    const settingsToUpdate = {
      ...emailSettings,
      email_enabled: emailSettings.is_active,
    }

    await emailService.updateSettings(settingsToUpdate)

    console.log("Email settings updated successfully")

    return NextResponse.json({
      success: true,
      message: "Email settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating email settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update email settings",
      },
      { status: 500 },
    )
  }
}
