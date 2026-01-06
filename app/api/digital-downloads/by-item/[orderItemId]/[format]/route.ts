import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { orderItemId: string; format: string } }) {
  try {
    const supabase = supabaseServer
    const { orderItemId, format } = params

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
    const { data: download, error: downloadError } = await supabase
      .from("digital_downloads")
      .select(`
        *,
        digital_order_items (
          *,
          digital_orders (*),
          digital_products (*)
        )
      `)
      .eq("order_item_id", orderItemId)
      .eq("format", format.toLowerCase())
      .single()

    if (downloadError || !download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 })
    }

    // Ownership check: user must own the order
    const ownerId = download.digital_order_items?.digital_orders?.user_id
    if (!ownerId || ownerId !== userData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if download is still valid
    const now = new Date()
    const expiresAt = new Date(download.expires_at)

    if (expiresAt <= now) {
      return NextResponse.json({ error: "Download link has expired" }, { status: 410 })
    }

    // Check download limit
    if (download.download_count >= 10) {
      return NextResponse.json({ error: "Download limit exceeded" }, { status: 429 })
    }

    // Update download count
    await supabase
      .from("digital_downloads")
      .update({
        download_count: download.download_count + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", download.id)

    // Generate signed URL from stored path or URL
    const rawUrl = download.file_url || download.file_path
    if (!rawUrl) {
      return NextResponse.json({ error: "File path unavailable" }, { status: 500 })
    }
    const parts = String(rawUrl).split("/")
    const bucketIdx = parts.findIndex((p) => p === "digital-products")
    const bucket = bucketIdx >= 0 ? "digital-products" : parts[bucketIdx]
    const filePath = bucketIdx >= 0 ? parts.slice(bucketIdx + 1).join("/") : parts.slice(-1)[0]
    const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, 900) // 15 min
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: "Failed to create download link" }, { status: 500 })
    }
    try {
      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
      if (endpoint) {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "download_started", payload: { orderItemId, format }, ts: Date.now() }),
        }).catch(() => {})
      }
    } catch {}
    return NextResponse.json({ url: signed.signedUrl, expiresIn: 900 })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
