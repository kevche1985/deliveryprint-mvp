import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, reason, description, amountRequested, paymentProvider, paymentCaptureId } = body
    if (!orderId || !reason) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const auth = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Auth required" }, { status: 401 })
    const token = auth.slice(7)
    const { data: userData, error: uerr } = await supabaseServer.auth.getUser(token)
    if (uerr || !userData?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    // Verify order belongs to user
    const { data: order } = await supabaseServer
      .from("orders")
      .select("id,user_id,payment_method,payment_transaction_id")
      .eq("id", orderId)
      .single()
    if (!order || order.user_id !== userData.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const insert = {
      order_id: orderId,
      user_id: userData.user.id,
      reason,
      description,
      amount_requested: Number(amountRequested || 0),
      payment_provider: paymentProvider || order.payment_method || null,
      payment_capture_id: paymentCaptureId || null,
      status: "open",
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabaseServer.from("disputes").insert([insert]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, dispute: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
