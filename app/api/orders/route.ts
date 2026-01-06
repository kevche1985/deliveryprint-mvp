import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
// Customer confirmation emails are sent after payment confirmation
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const OrderSchema = z
      .object({
        order_number: z.string().min(3),
        email: z.string().email(),
        status: z.string().min(1),
        subtotal: z.number().nonnegative(),
        tax: z.number().min(0),
        shipping: z.number().min(0),
        discount: z.number().min(0),
        total: z.number().positive(),
        shipping_method: z.string().optional(),
        payment_method: z.string().optional(),
        shipping_address: z.any().optional(),
        billing_address: z.any().optional(),
        notes: z.string().optional(),
        currency: z.string().default("USD"),
        user_id: z.string().optional(),
      })
      .strict()

    const parse = OrderSchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid order payload", details: parse.error.flatten() },
        { status: 400 },
      )
    }
    const safeOrder = parse.data

    // Create order in database
    const { data: order, error } = await supabase.from("orders").insert([safeOrder]).select().single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Do not send customer confirmation email at order creation time

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Error in order creation:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Error in orders fetch:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 },
    )
  }
}
