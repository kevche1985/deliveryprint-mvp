import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log(`🔍 Debugging order flow for: ${orderId}`)

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) {
      console.error("❌ Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found", details: orderError }, { status: 404 })
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)

    if (itemsError) {
      console.error("❌ Order items fetch error:", itemsError)
    }

    // Get digital downloads
    const { data: digitalDownloads, error: downloadsError } = await supabase
      .from("digital_downloads")
      .select("*")
      .eq("order_id", orderId)

    if (downloadsError) {
      console.error("❌ Digital downloads fetch error:", downloadsError)
    }

    // Get digital products if any design IDs exist
    let digitalProducts = []
    const designIds = orderItems?.filter((item) => item.design_id).map((item) => item.design_id) || []

    if (designIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("digital_products")
        .select("*")
        .in("id", designIds)

      if (productsError) {
        console.error("❌ Digital products fetch error:", productsError)
      } else {
        digitalProducts = products || []
      }
    }

    const debugInfo = {
      orderId,
      order: {
        ...order,
        created_at: order?.created_at,
        status: order?.status,
        total: order?.total,
        user_id: order?.user_id,
      },
      orderItems:
        orderItems?.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          design_id: item.design_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          design_image_url: item.design_image_url,
          design_file_url: item.design_file_url,
          has_customizations: !!item.customizations,
        })) || [],
      digitalDownloads:
        digitalDownloads?.map((download) => ({
          id: download.id,
          design_id: download.design_id,
          product_name: download.product_name,
          file_url: download.file_url,
          file_format: download.file_format,
          download_count: download.download_count,
          max_downloads: download.max_downloads,
          expires_at: download.expires_at,
        })) || [],
      digitalProducts: digitalProducts.map((product) => ({
        id: product.id,
        name: product.name,
        type: product.type,
        status: product.status,
        preview_url: product.preview_url,
        download_url: product.download_url,
        created_at: product.created_at,
      })),
      summary: {
        orderExists: !!order,
        orderItemsCount: orderItems?.length || 0,
        digitalDownloadsCount: digitalDownloads?.length || 0,
        digitalProductsCount: digitalProducts.length,
        designIds: designIds,
        hasDesignUrls: orderItems?.some((item) => item.design_image_url || item.design_file_url) || false,
      },
    }

    console.log("📊 Debug summary:", debugInfo.summary)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("💥 Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
