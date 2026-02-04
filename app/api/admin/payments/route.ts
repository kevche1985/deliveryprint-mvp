import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    const { data, error } = await supabaseServer.from("payment_settings").select("*").order("provider_name")
    if (error) {
      console.error("Error fetching payment settings:", error)
      return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 })
    }
    let rows = data || []
    if (rows.length === 0) {
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
      rows = seeded || []
    }
    // Fetch optional display name mapping from system_settings
    const { data: settings } = await supabaseServer
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "payment_display_names")
      .limit(1)
      .maybeSingle()
    const nameMap: Record<string, string> =
      (typeof settings?.setting_value === "string"
        ? (() => {
            try {
              return JSON.parse(settings!.setting_value as string)
            } catch {
              return {}
            }
          })()
        : settings?.setting_value) || {}
    const merged = rows.map((r: any) => ({
      ...r,
      display_name: r.display_name || nameMap[r.provider_name] || r.provider_name,
    }))
    return NextResponse.json(merged)
  } catch (error) {
    console.error("Error in GET /api/admin/payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const provider = await request.json()
    const baseUpdate: Record<string, any> = {
      is_active: provider.is_active,
      is_test_mode: provider.is_test_mode,
      api_key: provider.api_key,
      api_secret: provider.api_secret,
      webhook_url: provider.webhook_url,
      updated_at: new Date().toISOString(),
    }
    if (provider.webhook_secret !== undefined) baseUpdate.webhook_secret = provider.webhook_secret
    if (provider.endpoints !== undefined) baseUpdate.endpoints = provider.endpoints
    if (provider.additional_settings !== undefined) baseUpdate.additional_settings = provider.additional_settings
    if (provider.display_name !== undefined) baseUpdate.display_name = provider.display_name

    let { data, error } = await supabaseServer
      .from("payment_settings")
      .update(baseUpdate)
      .eq("id", provider.id)
      .select()

    // Fallback: if schema lacks some columns, update minimal fields and store display_name mapping
    if (error) {
      console.warn("Primary update failed, attempting minimal update:", error?.message || error)
      const minimalUpdate = {
        is_active: provider.is_active,
        is_test_mode: provider.is_test_mode,
        api_key: provider.api_key,
        api_secret: provider.api_secret,
        webhook_url: provider.webhook_url,
        updated_at: new Date().toISOString(),
      }
      const minimal = await supabaseServer.from("payment_settings").update(minimalUpdate).eq("id", provider.id).select()
      data = minimal.data
      if (minimal.error) {
        console.error("Minimal update failed:", minimal.error)
        return NextResponse.json({ error: "Failed to update payment settings" }, { status: 500 })
      }
      // Persist display_name mapping in system_settings
      if (provider.display_name) {
        // Read existing map
        const { data: existing } = await supabaseServer
          .from("system_settings")
          .select("id, setting_value")
          .eq("setting_key", "payment_display_names")
          .limit(1)
          .maybeSingle()
        let map: Record<string, string> = {}
        if (existing?.setting_value) {
          try {
            map =
              typeof existing.setting_value === "string"
                ? JSON.parse(existing.setting_value as string)
                : (existing.setting_value as any)
          } catch {
            map = {}
          }
        }
        // Find provider_name for this id
        const p = Array.isArray(data) ? data[0] : data
        const providerName = p?.provider_name || provider.provider_name
        if (providerName) {
          map[providerName] = provider.display_name
          const payload = { setting_value: JSON.stringify(map), updated_at: new Date().toISOString() }
          if (existing?.id) {
            await supabaseServer.from("system_settings").update(payload).eq("id", existing.id)
          } else {
            await supabaseServer
              .from("system_settings")
              .upsert([{ setting_key: "payment_display_names", setting_type: "json", ...payload }], {
                onConflict: "setting_key",
              })
          }
        }
      }
    }
    const row = Array.isArray(data) ? data[0] : data
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error in PUT /api/admin/payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
