import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Fetch all payment providers with their status from payment_settings table
    const { data: providers, error } = await supabase.from("payment_settings").select("*").order("provider_name")

    if (error) {
      console.error("Error fetching payment providers:", error)
      return NextResponse.json({ error: "Failed to fetch payment providers" }, { status: 500 })
    }

    // Format the response to show clear status
    const formattedProviders = (providers || []).map((provider) => ({
      provider_name: provider.provider_name,
      display_name: provider.display_name,
      is_active: provider.is_active,
      is_test_mode: provider.is_test_mode,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
    }))

    return NextResponse.json({
      total_providers: formattedProviders.length,
      active_providers: formattedProviders.filter((p) => p.is_active).length,
      inactive_providers: formattedProviders.filter((p) => !p.is_active).length,
      providers: formattedProviders,
    })
  } catch (error) {
    console.error("Error in payment providers status API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
