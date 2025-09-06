import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const orderId = params.id

    // Update order status to completed and delivered
    const { data: order, error: orderError } = await supabase
      .from("digital_orders")
      .update({
        status: "delivered",
        payment_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select(`
        *,
        digital_order_items (
          *,
          digital_products (*)
        )
      `)
      .single()

    if (orderError) {
      console.error("Error updating digital order:", orderError)
      return NextResponse.json({ error: "Failed to complete order" }, { status: 500 })
    }

    // Mark all order items as download ready
    const { error: itemsError } = await supabase
      .from("digital_order_items")
      .update({ download_ready: true })
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("Error updating order items:", itemsError)
      return NextResponse.json({ error: "Failed to prepare downloads" }, { status: 500 })
    }

    // Create download links for each item
    const downloadPromises = order.digital_order_items.map(async (item: any) => {
      const formats = item.selected_formats || []
      const downloadLinks = formats.map((format: string) => ({
        order_item_id: item.id,
        user_id: order.user_id,
        download_url: `/api/digital-downloads/${item.id}/${format}`,
        file_name: `${item.name.replace(/\s+/g, "_")}.${format.toLowerCase()}`,
        file_size: Math.floor(Math.random() * 5000000) + 1000000, // Mock file size
        format: format.toLowerCase(),
        expires_at: order.download_expires_at,
      }))

      return supabase.from("digital_downloads").insert(downloadLinks).select()
    })

    const downloadResults = await Promise.all(downloadPromises)
    const allDownloads = downloadResults.flatMap((result) => result.data || [])

    return NextResponse.json({
      order,
      downloads: allDownloads,
      message: "Order completed successfully",
    })
  } catch (error) {
    console.error("Error completing digital order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
