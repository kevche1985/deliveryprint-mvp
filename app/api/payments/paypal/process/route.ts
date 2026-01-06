import { NextResponse } from "next/server"
import { paypal } from "@/lib/paypal-client"
import { headers } from "next/headers"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const webhookId = headersList.get("paypal-transmission-id")

    if (!webhookId) {
      return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 })
    }

    const body = await request.text()
    const isValid = await paypal.verifyWebhookEvent(body, headersList)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = event.resource.invoice_id
      const captureId = event.resource.id
      const grossAmount = event.resource.amount.value

      if (!orderId || !captureId || !grossAmount) {
        console.error("Missing data in webhook event:", event)
        return NextResponse.json({ error: "Missing data in webhook event" }, { status: 400 })
      }

      const { data: existing } = await supabaseServer.from("orders").select("status,payment_status").eq("id", orderId).single()
      const prevStatus = existing?.status || "pending"
      const prevPay = existing?.payment_status || "unpaid"
      const canAdvance = ["pending", "created", "processing"].includes(prevStatus)
      const newFields: any = {
        paypal_capture_id: captureId,
        gross_amount: Number.parseFloat(grossAmount),
      }
      if (canAdvance) newFields.status = "confirmed"
      if (prevPay !== "paid") newFields.payment_status = "paid"
      const { data, error } = await supabaseServer.from("orders").update(newFields).eq("id", orderId)

      if (error) {
        console.error("Error updating order in database:", error)
        return NextResponse.json({ error: "Database update failed" }, { status: 500 })
      }

      console.log(`Order ${orderId} updated successfully with capture ID ${captureId}`)
      return NextResponse.json({ message: "Payment processed successfully" }, { status: 200 })
    } else {
      console.log(`Unhandled event type: ${event.event_type}`)
      return NextResponse.json({ message: "Unhandled event type" }, { status: 200 })
    }
  } catch (error: any) {
    console.error("Error processing webhook event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
