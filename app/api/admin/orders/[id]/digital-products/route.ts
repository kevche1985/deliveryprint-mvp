import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { requireRole } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole(request as any, ["admin", "operator"])
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
    }

    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("digital_products")
      .select("id,name,type,status,download_url,preview_url,created_at,updated_at,metadata")
      .eq("metadata->>order_id", orderId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch order digital products:", error)
      return NextResponse.json({ error: "Failed to fetch digital products" }, { status: 500 })
    }

    return NextResponse.json({ products: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

