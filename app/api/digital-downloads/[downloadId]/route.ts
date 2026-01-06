import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { downloadId: string } }) {
  try {
    const downloadId = params.downloadId
    const supabase = supabaseServer

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get the download record
    const { data: download, error: fetchError } = await supabase
      .from("digital_downloads")
      .select(`*, digital_order_items(*, digital_orders(user_id))`)
      .eq("id", downloadId)
      .single()

    if (fetchError || !download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 })
    }

    // Ownership
    const ownerId = download.digital_order_items?.digital_orders?.user_id
    if (!ownerId || ownerId !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if download is still valid
    if (download.download_count >= download.max_downloads) {
      return NextResponse.json({ error: "Download limit exceeded" }, { status: 403 })
    }

    if (download.expires_at && new Date(download.expires_at) < new Date()) {
      return NextResponse.json({ error: "Download has expired" }, { status: 403 })
    }

    // Increment download count
    const { error: incrementError } = await supabase.rpc("increment_download_count", {
      download_id: downloadId,
    })

    if (incrementError) {
      console.error("Failed to increment download count:", incrementError)
    }

    // Signed URL generation (15 minutes)
    const rawUrl = download.file_url || download.file_path
    if (!rawUrl) {
      return NextResponse.json({ error: "File path unavailable" }, { status: 500 })
    }
    const parts = String(rawUrl).split("/")
    const bucketIdx = parts.findIndex((p) => p === "digital-products")
    const bucket = bucketIdx >= 0 ? "digital-products" : parts[bucketIdx]
    const filePath = bucketIdx >= 0 ? parts.slice(bucketIdx + 1).join("/") : parts.slice(-1)[0]
    const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, 900)
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: "Failed to create download link" }, { status: 500 })
    }
    try {
      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "download_started", payload: { downloadId }, ts: Date.now() }),
        }).catch(() => {})
      }
    } catch {}
    return NextResponse.json({
      success: true,
      url: signed.signedUrl,
      product_name: download.product_name,
      format: download.file_format,
      expiresIn: 900,
      downloads_remaining: download.max_downloads - download.download_count - 1,
    })
  } catch (error) {
    console.error("Digital download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
