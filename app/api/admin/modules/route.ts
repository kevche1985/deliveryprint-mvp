import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { requireRole } from "@/lib/rbac"

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request as any, ["admin", "operator"])
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    }

    const { data: adminRow } = await supabaseServer
      .from("system_settings")
      .select("value")
      .eq("key", SETTINGS_ADMIN_KEY)
      .maybeSingle()
    const { data: webRow } = await supabaseServer
      .from("system_settings")
      .select("value")
      .eq("key", SETTINGS_WEB_KEY)
      .maybeSingle()

    const adminVisibility = (adminRow?.value as any) || DEFAULT_ADMIN_VISIBILITY
    const webVisibility = (webRow?.value as any) || DEFAULT_WEB_VISIBILITY

    const adminModules = [
      { key: "dashboard", label: "Dashboard", path: "/admin" },
      { key: "orders", label: "Orders", path: "/admin/orders" },
      { key: "products", label: "Products", path: "/admin/products" },
      { key: "services", label: "Services", path: "/admin/services" },
      { key: "users", label: "Users", path: "/admin/users" },
      { key: "quotes", label: "Quotes", path: "/admin/quotes" },
      { key: "transactions", label: "Transactions", path: "/admin/transactions" },
      { key: "disputes", label: "Disputes", path: "/admin/disputes" },
      { key: "emailSettings", label: "Email Settings", path: "/admin/email-settings" },
    ]
    const webModules = [
      { key: "products", label: "Products", path: "/products" },
      { key: "services", label: "Services (menu)", path: "/services" },
      { key: "servicesDigitalPrinting", label: "Services / Digital Printing", path: "/services/digital-printing" },
      { key: "servicesLargeFormat", label: "Services / Large Format", path: "/services/large-format" },
      { key: "servicesEventStands", label: "Services / Event Stands", path: "/services/event-stands" },
      { key: "servicesIlluminatedSigns", label: "Services / Illuminated Signs", path: "/services/illuminated-signs" },
      { key: "aiStudio", label: "AI Studio", path: "/ai-studio" },
      { key: "supplierPortal", label: "Supplier Portal", path: "/supplier/dashboard" },
    ]

    return NextResponse.json({
      modules: { admin: adminModules, web: webModules },
      visibility: { admin: adminVisibility, web: webVisibility },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole(request as any, ["admin", "operator"])
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    }
    const body = await request.json()
    const adminVisibility: Record<string, boolean> = body?.adminVisibility || {}
    const webVisibility: Record<string, boolean> = body?.webVisibility || {}

    const upserts = [
      { key: SETTINGS_ADMIN_KEY, value: adminVisibility, is_active: true },
      { key: SETTINGS_WEB_KEY, value: webVisibility, is_active: true },
    ]

    const { error } = await supabaseServer.from("system_settings").upsert(upserts, { onConflict: "key" })

    if (error) {
      console.error("Failed to save modules visibility:", error)
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
