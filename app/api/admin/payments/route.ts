import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const { data, error } = await supabaseServer.from("payment_settings").select("*").order("provider_name")

    if (error) {
      console.error("Error fetching payment settings:", error)
      return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      const defaults = [
        {
          provider_name: "wompi",
          display_name: "Credit/Debit Card",
          is_active: false,
          is_test_mode: true,
          endpoints: { base_url: "https://api.wompi.sv" },
          additional_settings: { currency: "USD", country: "SV", supported_methods: ["CARD"] },
        },
        {
          provider_name: "paypal",
          display_name: "PayPal",
          is_active: false,
          is_test_mode: true,
          endpoints: { base_url: "https://api.paypal.com" },
          additional_settings: { currency: "USD", country: "US", supported_methods: ["paypal", "card"] },
        },
        {
          provider_name: "stripe",
          display_name: "Stripe",
          is_active: false,
          is_test_mode: true,
          endpoints: { base_url: "https://api.stripe.com" },
          additional_settings: { currency: "USD", country: "US", supported_methods: ["card"] },
        },
        {
          provider_name: "cash_on_delivery",
          display_name: "Cash on Delivery",
          is_active: true,
          is_test_mode: false,
          endpoints: {},
          additional_settings: { description: "Pay when you receive" },
        },
      ]
      const { data: seeded, error: seedErr } = await supabaseServer
        .from("payment_settings")
        .upsert(defaults, { onConflict: "provider_name" })
        .select("*")
        .order("provider_name")
      if (seedErr) {
        console.error("Error seeding payment settings:", seedErr)
        return NextResponse.json({ error: "Failed to seed payment settings" }, { status: 500 })
      }
      return NextResponse.json(seeded)
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

    const { data, error } = await supabaseServer
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
