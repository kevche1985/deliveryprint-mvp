import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import JSZip from "jszip"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the user's session
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }

    // Get the order with proper error handling
    const { data: orders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          name,
          design_file_url,
          customized_image_url,
          print_ready_file_url
        )
      `)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .limit(1)

    if (orderError) {
      console.error("Database error:", orderError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    const order = orders[0]

    // Get all design files from order items
    const designFiles: Array<{ url: string; filename: string }> = []

    for (const item of order.order_items || []) {
      if (item.design_file_url) {
        designFiles.push({
          url: item.design_file_url,
          filename: `${item.name.replace(/[^a-zA-Z0-9]/g, "_")}_design.jpg`,
        })
      }
      if (item.customized_image_url) {
        designFiles.push({
          url: item.customized_image_url,
          filename: `${item.name.replace(/[^a-zA-Z0-9]/g, "_")}_customized.jpg`,
        })
      }
      if (item.print_ready_file_url) {
        designFiles.push({
          url: item.print_ready_file_url,
          filename: `${item.name.replace(/[^a-zA-Z0-9]/g, "_")}_print_ready.pdf`,
        })
      }
    }

    if (designFiles.length === 0) {
      return NextResponse.json({ error: "No design files found for this order" }, { status: 404 })
    }

    // Create ZIP file
    const zip = new JSZip()

    // Download and add files to ZIP
    for (const file of designFiles) {
      try {
        const response = await fetch(file.url)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          zip.file(file.filename, buffer)
        }
      } catch (error) {
        console.error(`Error downloading file ${file.url}:`, error)
        // Continue with other files even if one fails
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="order_${order.order_number || orderId.slice(0, 8)}_designs.zip"`,
      },
    })
  } catch (error) {
    console.error("Error in download-all route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
