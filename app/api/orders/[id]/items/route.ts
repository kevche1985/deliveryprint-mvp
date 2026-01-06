import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    const body = await request.json()
    if (!orderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    const item = { ...body, order_id: orderId }
    if (!item.name || !item.price) return NextResponse.json({ error: "Invalid item" }, { status: 400 })
    const { data, error } = await supabaseServer.from("order_items").insert([item]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, item: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

