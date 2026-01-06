import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Auth required" }, { status: 401 })
    const token = auth.slice(7)
    const { data: userData } = await supabaseServer.auth.getUser(token)
    const userId = userData?.user?.id
    if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 })

    const { data: orders } = await supabaseServer
      .from("orders")
      .select("id, order_number, status, total, created_at, payment_status, payment_method")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25)

    const res = NextResponse.json({ orders: orders || [] })
    res.headers.set("Cache-Control", "private, max-age=30")
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

