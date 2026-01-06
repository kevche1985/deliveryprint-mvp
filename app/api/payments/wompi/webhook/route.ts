import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

const WOMPI_WEBHOOK_SECRET = process.env.WOMPI_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-wompi-signature")

    // Verify webhook signature if secret is configured
    if (WOMPI_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto.createHmac("sha256", WOMPI_WEBHOOK_SECRET).update(body).digest("hex")

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Parse the webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (parseError) {
      console.error("Invalid JSON in webhook:", parseError)
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Received webhook

    // Extract transaction information from webhook
    const {
      idTransaccion,
      idExterno,
      estado,
      codigoRespuesta,
      mensajeRespuesta,
      monto,
      numeroReferencia,
      codigoAutorizacion,
    } = webhookData

    if (!idTransaccion && !idExterno) {
      console.error("No transaction ID found in webhook")
      return NextResponse.json({ error: "No transaction ID" }, { status: 400 })
    }

    // Find the transaction in our database
    let transactionQuery = supabase.from("wompi_transactions").select("*")

    if (idTransaccion) {
      transactionQuery = transactionQuery.eq("wompi_transaction_id", idTransaccion)
    } else {
      transactionQuery = transactionQuery.or(`external_id.eq.${idExterno},id_externo.eq.${idExterno}`)
    }

    const { data: transaction, error: findError } = await transactionQuery.single()

    if (findError) {
      console.error("Transaction not found for webhook:", findError)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update transaction with webhook data
    const updateData: any = {
      wompi_response: webhookData,
      updated_at: new Date().toISOString(),
    }

    // Map Wompi status to our status
    if (estado === "APROBADA" || codigoRespuesta === "00") {
      updateData.status = "completed"
      updateData.estado = "completado"
    } else if (estado === "RECHAZADA" || codigoRespuesta !== "00") {
      updateData.status = "failed"
      updateData.estado = "fallido"
      updateData.error_code = codigoRespuesta
      updateData.error_message = mensajeRespuesta
    }

    if (idTransaccion) {
      updateData.wompi_transaction_id = idTransaccion
    }
    if (numeroReferencia) {
      updateData.reference_number = numeroReferencia
    }
    if (codigoAutorizacion) {
      updateData.authorization_code = codigoAutorizacion
    }

    // Update the transaction
    const { error: updateError } = await supabase.from("wompi_transactions").update(updateData).eq("id", transaction.id)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    // Record in the unified payment_transactions table
    const { error: unifiedTransactionError } = await supabase.from("payment_transactions").insert({
      order_id: transaction.external_id || transaction.id_externo,
      provider_name: "wompi",
      transaction_id: crypto.randomUUID(), // Generate a unique internal transaction ID
      external_transaction_id: idTransaccion || transaction.wompi_transaction_id,
      amount: monto || transaction.amount,
      currency: "USD", // Default to USD
      status: updateData.status || transaction.status,
      payment_method: "wompi",
      response_data: webhookData,
      error_message: updateData.error_message || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (unifiedTransactionError) {
      console.error("Error recording unified payment transaction:", unifiedTransactionError)
      // Continue even if this fails, as we already updated the wompi_transactions table
    }

    // Update the related order if payment was successful (forward-only)
    if (updateData.status === "completed") {
      const orderId = transaction.external_id || transaction.id_externo

      if (orderId) {
        const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single()
        const prev = order?.status || "pending"
        if (["pending", "created", "processing"].includes(prev)) {
          await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_method: "wompi",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
        }
      }
    }

    // Webhook processed

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (error) {
    console.error("Error processing Wompi webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
