import { NextResponse } from "next/server"
import { requireRole } from "@/lib/rbac"
import { supabaseServer } from "@/lib/supabase-server"

function sanitizeVariantDimensions(input: any) {
  if (!Array.isArray(input)) return undefined
  const cleaned = input
    .map((d: any) => {
      const name = typeof d?.name === "string" ? d.name.trim() : ""
      const key = typeof d?.key === "string" ? d.key.trim() : ""
      const optionsRaw = Array.isArray(d?.options) ? d.options : null
      const valuesRaw = !optionsRaw && Array.isArray(d?.values) ? d.values : []
      const normalizedOptions = (optionsRaw || valuesRaw.map((v: any) => ({ value: v, price: 0, sku: null })))
        .map((o: any) => {
          const value = typeof o?.value === "string" ? o.value.trim() : String(o ?? "").trim()
          const price = Number.isFinite(Number(o?.price)) ? Number(o.price) : 0
          const sku = typeof o?.sku === "string" && o.sku.trim() ? o.sku.trim() : null
          if (!value) return null
          return { value, price, sku }
        })
        .filter(Boolean)
      if (!name || !key || normalizedOptions.length === 0) return null
      return { name, key, options: normalizedOptions }
    })
    .filter(Boolean)
  return cleaned
}

async function syncPrimaryImage(productId: string, imageUrl: string) {
  const { data: existing } = await supabaseServer
    .from("product_images")
    .select("id,display_order")
    .eq("product_id", productId)
    .eq("url", imageUrl)
    .maybeSingle()

  if (!existing?.id) {
    const { data: maxRow } = await supabaseServer
      .from("product_images")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextOrder = (typeof (maxRow as any)?.display_order === "number" ? (maxRow as any).display_order : 0) + 1

    const { error: insertError } = await supabaseServer.from("product_images").insert([
      { product_id: productId, url: imageUrl, alt_text: null, is_primary: true, display_order: nextOrder },
    ])
    if (insertError) throw insertError
  } else {
    const { error: setError } = await supabaseServer.from("product_images").update({ is_primary: true }).eq("id", existing.id)
    if (setError) throw setError
  }

  const { error: clearError } = await supabaseServer
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId)
    .neq("url", imageUrl)
  if (clearError) throw clearError
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin", "operator"])
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  const productId = context.params.id
  const body = await req.json().catch(() => ({}))
  const variantDimensions = sanitizeVariantDimensions(body?.variant_dimensions)
  const productData = {
    name: typeof body?.name === "string" ? body.name : "",
    description: typeof body?.description === "string" && body.description.trim() ? body.description : null,
    price: Number.isFinite(Number(body?.price)) ? Number(body.price) : 0,
    category: typeof body?.category === "string" && body.category.trim() ? body.category : null,
    image: typeof body?.image === "string" && body.image.trim() ? body.image : null,
    is_active: typeof body?.is_active === "boolean" ? body.is_active : true,
    is_featured: typeof body?.is_featured === "boolean" ? body.is_featured : false,
    is_customizable: typeof body?.is_customizable === "boolean" ? body.is_customizable : true,
    ...(variantDimensions ? { variant_dimensions: variantDimensions } : {}),
  }

  if (!productData.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const attempt = await supabaseServer.from("products").update(productData as any).eq("id", productId).select("*").single()
  if (attempt.error) {
    const msg = attempt.error.message || ""
    if (/variant_dimensions/i.test(msg)) {
      const { variant_dimensions, ...legacy } = productData as any
      const attempt2 = await supabaseServer.from("products").update(legacy).eq("id", productId).select("*").single()
      if (attempt2.error) return NextResponse.json({ error: attempt2.error.message }, { status: 500 })
      const updated2 = attempt2.data
      if (productData.image) {
        try {
          await syncPrimaryImage(productId, productData.image)
        } catch (e: any) {
          return NextResponse.json({ error: e?.message || "Failed to sync primary image", product: updated2 }, { status: 500 })
        }
      }
      return NextResponse.json({ product: updated2 })
    }
    return NextResponse.json({ error: attempt.error.message }, { status: 500 })
  }
  const updated = attempt.data

  if (productData.image) {
    try {
      await syncPrimaryImage(productId, productData.image)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || "Failed to sync primary image", product: updated }, { status: 500 })
    }
  }

  return NextResponse.json({ product: updated })
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin", "operator"])
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })

  const productId = context.params.id
  const { error } = await supabaseServer.from("products").delete().eq("id", productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
