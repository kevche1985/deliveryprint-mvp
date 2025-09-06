import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create order in database
    const { data: order, error } = await supabase.from("orders").insert([body]).select().single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmationNotification(order)
      console.log("Order confirmation email sent for order:", order.id)
    } catch (emailError) {
      console.error("Error sending order confirmation email:", emailError)
      // Don't fail the order creation if email fails
    }

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
