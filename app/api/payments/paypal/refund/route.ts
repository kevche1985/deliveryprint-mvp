import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { paypal } from "@/lib/paypal-client"

export async function POST(request: Request) {
  try {
    const { orderId, captureId, amount } = await request.json()
    if (!orderId && !captureId) {
      return NextResponse.json({ error: "orderId or captureId required" }, { status: 400 })
    }

    const supabase = supabaseServer

    let capId = captureId
    if (!capId && orderId) {
      const { data: order, error } = await supabase.from("orders").select("paypal_capture_id, user_id, total, currency, payment_status").eq("id", orderId).single()
      if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
      if (order.payment_status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 409 })
      capId = order.paypal_capture_id
      if (!capId) return NextResponse.json({ error: "No capture ID on order" }, { status: 400 })
    }

    const accessToken = await paypal.getAccessToken()
    const refund = await paypal.refundCapture(accessToken, capId!, amount)

    if (orderId) {
      await supabase
        .from("orders")
        .update({ payment_status: "refunded", status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", orderId)
    }

    await supabase.from("paypal_transactions").insert({
      order_id: orderId || null,
      paypal_order_id: null,
      status: "refunded",
      transaction_data: refund,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, refund })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Refund failed" }, { status: 500 })
  }
}

