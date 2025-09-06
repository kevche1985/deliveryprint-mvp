import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Update the order status to cancelled
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()

    if (error) {
      console.error("Error cancelling order:", error)
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order: data[0],
    })
  } catch (error) {
    console.error("Error in cancel order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
