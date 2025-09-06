import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypal } from "@/lib/paypal-client"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { orderID, orderId: dbOrderId } = await request.json()

    console.log("Capturing PayPal order:", orderID, "DB Order ID:", dbOrderId)

    if (!orderID) {
      return NextResponse.json({ success: false, error: "PayPal Order ID is required" }, { status: 400 })
    }

    // Capture the PayPal order
    const captureResponse = await paypal.capturePayment(orderID)

    if (!captureResponse || !captureResponse.result) {
      console.error("Failed to capture PayPal payment:", captureResponse)
      return NextResponse.json({ success: false, error: "Failed to capture payment" }, { status: 500 })
    }

    const captureResult = captureResponse.result
    console.log("PayPal capture successful:", captureResult.id)

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Record the transaction in the database
    const { data: transactionData, error: transactionError } = await supabase
      .from("paypal_transactions")
      .insert({
        paypal_order_id: orderID,
        order_id: dbOrderId,
        status: captureResult.status,
        amount: captureResult.purchase_units[0]?.payments?.captures?.[0]?.amount?.value || 0,
        currency: captureResult.purchase_units[0]?.payments?.captures?.[0]?.amount?.currency_code || "USD",
        payer_id: captureResult.payer?.payer_id,
        payer_email: captureResult.payer?.email_address,
        transaction_data: captureResult,
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error recording PayPal transaction:", transactionError)
    }

    // Update the order status in the database
    if (dbOrderId) {
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_method: "paypal",
          payment_id: orderID,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbOrderId)

      if (orderError) {
        console.error("Error updating order status:", orderError)
      }

      // IMPORTANT: Update digital products status
      // Get the order to find the user ID
      const { data: order } = await supabase.from("orders").select("user_id").eq("id", dbOrderId).single()

      if (order && order.user_id) {
        // Call the payment confirmation API to update digital products
        const confirmResponse = await fetch(new URL("/api/payments/confirm", request.url).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: dbOrderId,
            transactionId: orderID,
            // We don't have cart items here, but the confirm API will handle it
          }),
        })

        if (!confirmResponse.ok) {
          console.error("Failed to confirm payment for digital products")
        }
      }
    }

    return NextResponse.json({
      success: true,
      captureId: captureResult.id,
      status: captureResult.status,
      transactionData,
    })
  } catch (error) {
    console.error("Error capturing PayPal payment:", error)
    return NextResponse.json({ success: false, error: "Failed to capture payment" }, { status: 500 })
  }
}
