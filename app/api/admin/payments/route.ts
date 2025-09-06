import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("payment_settings").select("*").order("provider_name")

    if (error) {
      console.error("Error fetching payment settings:", error)
      return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/admin/payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const provider = await request.json()

    const { data, error } = await supabase
      .from("payment_settings")
      .update({
        display_name: provider.display_name,
        is_active: provider.is_active,
        is_test_mode: provider.is_test_mode,
        api_key: provider.api_key,
        api_secret: provider.api_secret,
        webhook_url: provider.webhook_url,
        webhook_secret: provider.webhook_secret,
        endpoints: provider.endpoints,
        additional_settings: provider.additional_settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", provider.id)
      .select()

    if (error) {
      console.error("Error updating payment settings:", error)
      return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in PUT /api/admin/payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
