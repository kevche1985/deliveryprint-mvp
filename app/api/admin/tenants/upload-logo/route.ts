import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not available" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const slugRaw = formData.get("slug")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const slug = typeof slugRaw === "string" && slugRaw.trim() ? slugRaw.trim().toLowerCase().replace(/_/g, "-") : "primary"

    // Ensure bucket exists
    const { data: bucketInfo } = await supabaseAdmin.storage.getBucket("tenant-logos")
    if (!bucketInfo) {
      await supabaseAdmin.storage.createBucket("tenant-logos", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
      })
    }

    const fileNameParts = (file.name || "logo").split(".")
    const ext = fileNameParts.length > 1 ? fileNameParts.pop() : "png"
    const fileNameBase = fileNameParts.join(".") || "logo"
    const path = `${slug}/logo-${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const uploadRes = await supabaseAdmin.storage.from("tenant-logos").upload(path, arrayBuffer, {
      contentType: file.type || "image/png",
      upsert: true,
      cacheControl: "3600",
    })

    if (uploadRes.error) {
      return NextResponse.json({ error: uploadRes.error.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("tenant-logos").getPublicUrl(path)
    const publicUrl = publicUrlData.publicUrl

    return NextResponse.json({ url: publicUrl, path })
  } catch (error: any) {
    console.error("Upload logo error:", error)
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
  }
}