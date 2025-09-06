import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { orderItemId: string; format: string } }) {
  try {
    const supabase = createClient()
    const { orderItemId, format } = params

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

    // In a real implementation, you would serve the actual file here
    // For now, we'll return a mock download response
    const mockFileContent = `Mock ${format.toUpperCase()} file content for ${download.digital_order_items.digital_products.name}`

    return new NextResponse(mockFileContent, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${download.file_name}"`,
        "Content-Length": download.file_size?.toString() || "0",
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
