import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Fetch all active payment providers from payment_settings table
    const { data: providers, error } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("is_active", true)
      .order("provider_name")

    if (error) {
      console.error("Error fetching active payment providers:", error)
      return NextResponse.json({ error: "Failed to fetch payment providers" }, { status: 500 })
    }

    return NextResponse.json(providers || [])
  } catch (error) {
    console.error("Error in active payment providers API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
