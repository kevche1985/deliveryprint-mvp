import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let query = supabase
      .from("digital_orders")
      .select(`
        *,
        digital_order_items (
          *,
          digital_products (*)
        )
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching digital orders:", error)
      return NextResponse.json({ error: "Failed to fetch digital orders" }, { status: 500 })
    }

    return NextResponse.json({ orders: data })
  } catch (error) {
    console.error("Error in digital orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      orderNumber,
      userId,
      email,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      billingAddress,
      currency = "USD",
    } = body

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("digital_orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email,
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
        billing_address: billingAddress,
        currency,
        download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating digital order:", orderError)
      return NextResponse.json({ error: "Failed to create digital order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      base_price: item.basePrice,
      selected_formats: item.selectedFormats,
      selected_license: item.selectedLicense,
      format_options: item.formatOptions,
      license_options: item.licenseOptions,
      final_price: item.finalPrice,
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from("digital_order_items")
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error("Error creating digital order items:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    return NextResponse.json({
      order: { ...order, digital_order_items: createdItems },
    })
  } catch (error) {
    console.error("Error in digital orders POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
