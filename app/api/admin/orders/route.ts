import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { requireRole } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req as any, ["admin", "operator"])
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    }
    const { data, error } = await supabaseServer
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          name,
          quantity,
          price,
          customizations,
          design_file_url,
          product_image_url,
          design_image_url,
          customized_image_url,
          print_ready_file_url,
          product_id,
          digital_product_id,
          digital_product:digital_products (
            id,
            download_url,
            preview_url,
            type
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch admin orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({ orders: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
