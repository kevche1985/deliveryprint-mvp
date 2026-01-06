import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const auth = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) return NextResponse.json({ error: "Auth required" }, { status: 401 })
    const token = auth.slice(7)
    const { data: userData } = await supabaseServer.auth.getUser(token)
    const { data: profile } = await supabaseServer.from("user_profiles").select("role").eq("id", userData?.user?.id).single()
    const isAdmin = profile?.role === "admin" || profile?.role === "operator"
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const update = { ...body, updated_at: new Date().toISOString() }
    const { data, error } = await supabaseServer.from("disputes").update(update).eq("id", id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, dispute: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}

