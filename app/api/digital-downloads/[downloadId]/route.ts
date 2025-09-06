import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { downloadId: string } }) {
  try {
    const downloadId = params.downloadId

    // Get the download record
    const { data: download, error: fetchError } = await supabase
      .from("digital_downloads")
      .select("*")
      .eq("id", downloadId)
      .single()

    if (fetchError || !download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 })
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

    // Return the file URL for download
    return NextResponse.json({
      success: true,
      file_url: download.file_url,
      product_name: download.product_name,
      format: download.file_format,
      downloads_remaining: download.max_downloads - download.download_count - 1,
    })
  } catch (error) {
    console.error("Digital download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
