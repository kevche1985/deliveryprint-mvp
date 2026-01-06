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
    const { data: dispute } = await supabaseServer.from("disputes").select("user_id").eq("id", disputeId).single()
    if (!isAdmin && (!dispute || dispute.user_id !== userData.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const form = await request.formData()
    const file = form.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const filename = `${Date.now()}_${file.name}`
    const path = `disputes/${disputeId}/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseServer.storage.from("web-images").upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const publicUrl = supabaseServer.storage.from("web-images").getPublicUrl(path).data.publicUrl

    const { data, error } = await supabaseServer.from("dispute_files").insert([{ dispute_id: disputeId, filename: file.name, path: publicUrl, mime_type: file.type || null, size: (file as any).size || null }]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, file: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 })
  }
}
