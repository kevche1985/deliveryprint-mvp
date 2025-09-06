import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    console.log("Recording PayPal transaction")

    const body = await request.json()
    const { orderId, paypalOrderId, paypalTransactionId, amount, status, paypalResponse, currency = "USD" } = body

    if (!orderId || !paypalOrderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Transaction details:", { orderId, paypalOrderId, paypalTransactionId, status })

    // Record in the unified payment_transactions table
    const { data: unifiedTransactionData, error: unifiedTransactionError } = await supabaseServer
      .from("payment_transactions")
      .insert({
        order_id: orderId,
        provider_name: "paypal",
        transaction_id: crypto.randomUUID(), // Generate a unique internal transaction ID
        external_transaction_id: paypalTransactionId || paypalOrderId,
        amount: amount,
        currency: currency,
        status: status.toLowerCase(),
        payment_method: "paypal",
        response_data: paypalResponse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (unifiedTransactionError) {
      console.error("Error recording unified payment transaction:", unifiedTransactionError)
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
    }

    // Also record in the paypal_transactions table for backward compatibility
    const { data: transactionData, error: transactionError } = await supabaseServer
      .from("paypal_transactions")
      .insert({
        order_id: orderId,
        paypal_order_id: paypalOrderId,
        transaction_id: paypalTransactionId,
        amount: amount,
        status: status.toLowerCase(),
        paypal_response: paypalResponse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (transactionError) {
      console.error("Error recording PayPal transaction:", transactionError)
      // Continue even if this fails, as we already recorded in the unified table
    }

    // Update the order status using existing columns
    const { error: orderError } = await supabaseServer
      .from("orders")
      .update({
        status: "confirmed", // Update to confirmed status after payment
        payment_method: "paypal", // Set payment method to paypal
        notes: `PayPal payment completed. Transaction ID: ${paypalTransactionId || paypalOrderId}. Amount: $${amount}. Status: ${status}. Payment Date: ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (orderError) {
      console.error("Error updating order status:", orderError)
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
    }

    console.log("Order updated successfully with PayPal payment info")

    return NextResponse.json({
      success: true,
      message: "Transaction recorded successfully",
      transaction: unifiedTransactionData?.[0] || null,
    })
  } catch (error: any) {
    console.error("Error in record-transaction API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
