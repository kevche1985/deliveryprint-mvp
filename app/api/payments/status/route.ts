import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const transactionId = searchParams.get("transactionId")

    if (!orderId && !transactionId) {
      return NextResponse.json({ success: false, error: "Order ID or Transaction ID is required" }, { status: 400 })
    }

    // First, try to find the transaction
    let transactionQuery = supabase.from("wompi_transactions").select("*")

    if (transactionId) {
      transactionQuery = transactionQuery.eq("id", transactionId)
    } else if (orderId) {
      // Try both external_id and id_externo columns
      transactionQuery = transactionQuery.or(`external_id.eq.${orderId},id_externo.eq.${orderId}`)
    }

    const { data: transaction, error: transactionError } = await transactionQuery.single()

    if (transactionError) {
      console.error("Error fetching transaction:", transactionError)

      // If transaction not found, check if order exists
      if (orderId) {
        const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

        if (orderError) {
          return NextResponse.json({ success: false, error: "Order not found", status: "not_found" }, { status: 404 })
        }

        // Order exists but no transaction found - might be a different payment method
        return NextResponse.json({
          success: true,
          status: order.status || "pending",
          orderId: order.id,
          order,
          message: "Order found but payment transaction not found",
        })
      }

      return NextResponse.json({ success: false, error: "Transaction not found", status: "not_found" }, { status: 404 })
    }

    // Get the order details if we have an order ID
    let order = null
    const orderIdToUse = orderId || transaction.external_id || transaction.id_externo

    if (orderIdToUse) {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderIdToUse)
        .single()

      if (!orderError) {
        order = orderData
      }
    }

    // Determine the status based on both Spanish and English columns
    let status = transaction.status || transaction.estado || "pending"

    // Map Spanish statuses to English
    const statusMap: Record<string, string> = {
      completado: "completed",
      pendiente: "pending",
      fallido: "failed",
      pending_3ds: "pending_3ds",
      completed: "completed",
      failed: "failed",
      pending: "pending",
    }

    status = statusMap[status] || status

    // Check if this is a mock transaction for testing
    const isMock =
      transaction.datos_adicionales?.mock_response ||
      transaction.additional_data?.mock_response ||
      transaction.wompi_response?.success

    // For mock transactions, simulate completion after 3DS
    if (isMock && status === "pending_3ds") {
      // Update the transaction to completed for mock
      const updateData = {
        status: "completed",
        estado: "completado",
        updated_at: new Date().toISOString(),
      }

      await supabase.from("wompi_transactions").update(updateData).eq("id", transaction.id)

      status = "completed"
      transaction.status = "completed"
      transaction.estado = "completado"

      // Also update the order status if it exists
      if (order) {
        await supabase
          .from("orders")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
      }
    }

    // Prepare response data
    const responseData = {
      success: true,
      status,
      orderId: orderIdToUse,
      transactionId: transaction.id,
      transaction,
      order,
      message: getStatusMessage(status, transaction),
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        status: "error",
      },
      { status: 500 },
    )
  }
}

function getStatusMessage(status: string, transaction: any): string {
  switch (status) {
    case "completed":
      return "Payment completed successfully!"
    case "pending_3ds":
      return "3DS authentication in progress..."
    case "pending":
      return "Payment is being processed..."
    case "failed":
      return (
        transaction.error_message ||
        transaction.datos_adicionales?.mock_response?.mensajeRespuesta ||
        transaction.additional_data?.mock_response?.mensajeRespuesta ||
        "Payment failed"
      )
    default:
      return "Payment status unknown"
  }
}
