import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not available" }, { status: 500 })
    }

    let body: any
    try {
      body = await request.json()
    } catch (e: any) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const {
      slug,
      name,
      logo_url,
      brand_bg_color,
      brand_ui_color,
      email_from,
    } = body || {}

    const normalizedSlug = typeof slug === "string" ? slug.trim().toLowerCase().replace(/_/g, "-") : ""
    if (!normalizedSlug || !/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 })
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Quick connectivity/table existence check
    const ping = await supabaseAdmin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .limit(1)
    if (ping.error) {
      console.error("Ping tenants error:", ping.error)
      return NextResponse.json(
        {
          error: ping.error.message || "Database access error",
          code: (ping.error as any).code,
          details: (ping.error as any).details,
        },
        { status: 500 },
      )
    }

    // Uniqueness check should use count
    const { count: slugCount, error: checkErr } = await supabaseAdmin
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("slug", normalizedSlug)

    if (checkErr) {
      console.error("Check slug error:", checkErr)
    }

    if ((slugCount ?? 0) > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .insert([
        {
          slug: normalizedSlug,
          name: String(name).trim(),
          logo_url: logo_url ? String(logo_url).trim() : null,
          brand_bg_color: brand_bg_color || null,
          brand_ui_color: brand_ui_color || null,
          email_from: email_from ? String(email_from).trim() : null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Create tenant error:", error)
      return NextResponse.json(
        {
          error: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ tenant: data })
  } catch (error: any) {
    console.error("Tenant create error:", error)
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
  }
}