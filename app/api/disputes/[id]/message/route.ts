import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const disputeId = params.id
    const auth = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Auth required" }, { status: 401 })
    const token = auth.slice(7)
    const { data: userData } = await supabaseServer.auth.getUser(token)
    if (!userData?.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    // Verify actor is owner or admin/operator
    const { data: profile } = await supabaseServer.from("user_profiles").select("role").eq("id", userData.user.id).single()
    const isAdmin = profile?.role === "admin" || profile?.role === "operator"
    const { data: dispute } = await supabaseServer.from("disputes").select("user_id").eq("id", params.id).single()
    if (!isAdmin && (!dispute || dispute.user_id !== userData.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { message } = await request.json()
    if (!message || typeof message !== "string") return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    const { data, error } = await supabaseServer.from("dispute_comments").insert([{ dispute_id: disputeId, user_id: userData.user.id, comment: message }]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, comment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
