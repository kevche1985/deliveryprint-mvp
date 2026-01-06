import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { paypal } from "@/lib/paypal-client"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { amount } = body || {}
    const auth = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Auth required" }, { status: 401 })
    const token = auth.slice(7)
    const { data: userData } = await supabaseServer.auth.getUser(token)
    const { data: profile } = await supabaseServer.from("user_profiles").select("role").eq("id", userData?.user?.id).single()
    const isAdmin = profile?.role === "admin" || profile?.role === "operator"
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { data: dispute } = await supabaseServer.from("disputes").select("*, orders(id, payment_method)").eq("id", id).single()
    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    const method = dispute.orders?.payment_method || dispute.payment_provider

    if (method === "paypal") {
      const accessToken = await paypal.getAccessToken()
      const capId = dispute.payment_capture_id
      const amt = amount ? { value: Number(amount).toFixed(2), currency_code: "USD" } : undefined
      const refund = await paypal.refundCapture(accessToken, capId, amt)
      await supabaseServer.from("disputes").update({ status: "refunded", amount_approved: amount || dispute.amount_requested, updated_at: new Date().toISOString(), resolution: "refunded via PayPal" }).eq("id", id)
      return NextResponse.json({ success: true, refund })
    }

    if (method === "wompi") {
      return NextResponse.json({ error: "Wompi refund not implemented" }, { status: 501 })
    }

    return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

