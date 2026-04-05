import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const SETTINGS_ADMIN_KEY = "admin_modules_visibility"
const SETTINGS_WEB_KEY = "web_modules_visibility"

const DEFAULT_ADMIN_VISIBILITY: Record<string, boolean> = {
  dashboard: true,
  orders: true,
  products: true,
  services: true,
  users: true,
  quotes: true,
  transactions: true,
  disputes: true,
  emailSettings: true,
}
const DEFAULT_WEB_VISIBILITY: Record<string, boolean> = {
  products: true,
  services: true,
  servicesDigitalPrinting: true,
  servicesLargeFormat: true,
  servicesEventStands: true,
  servicesIlluminatedSigns: true,
  aiStudio: true,
  supplierPortal: true,
}

export async function GET() {
  try {
    const { data: adminRow } = await supabaseServer
      .from("system_settings")
      .select("value")
      .eq("key", SETTINGS_ADMIN_KEY)
      .eq("is_active", true)
      .maybeSingle()
    const { data: webRow } = await supabaseServer
      .from("system_settings")
      .select("value")
      .eq("key", SETTINGS_WEB_KEY)
      .eq("is_active", true)
      .maybeSingle()

    const admin = (adminRow?.value as any) || DEFAULT_ADMIN_VISIBILITY
    const web = (webRow?.value as any) || DEFAULT_WEB_VISIBILITY
    return NextResponse.json({ admin, web })
  } catch (e: any) {
    return NextResponse.json({ admin: DEFAULT_ADMIN_VISIBILITY, web: DEFAULT_WEB_VISIBILITY })
  }
}
