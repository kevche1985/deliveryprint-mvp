import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { getPayPalAccessToken, createPayPalOrder } from "@/lib/paypal-client"

export const runtime = "edge" // Can use edge runtime with fetch

export async function POST(request: NextRequest) {
  try {
    console.log("PayPal create-order API called")

    const body = await request.json()
    console.log("Request body:", body)

    const { total, orderId, items, billingInfo, shippingInfo, subtotal, tax, shipping } = body

    // Validate required fields
    if (!total || total <= 0) {
      console.error("Invalid amount:", total)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!orderId) {
      console.error("Missing order ID")
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Invalid items:", items)
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error("PayPal credentials not configured")
      return NextResponse.json({ error: "PayPal not configured" }, { status: 500 })
    }

    console.log("Creating PayPal order for:", { orderId, total, itemCount: items.length })

    try {
      // Get PayPal access token
      const accessToken = await getPayPalAccessToken()
      console.log("PayPal access token obtained successfully")

      // Calculate amounts properly
      const itemTotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
      const taxAmount = tax || 0
      const shippingAmount = shipping || 0

      // Ensure the total matches the breakdown
      const calculatedTotal = itemTotal + taxAmount + shippingAmount

      console.log("Amount breakdown:", {
        itemTotal: itemTotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        calculatedTotal: calculatedTotal.toFixed(2),
        providedTotal: total.toFixed(2),
      })

      // Use the calculated total to ensure consistency
      const finalTotal = calculatedTotal

      // Get the base URL for redirects
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin || "http://localhost:3000"

      // Create PayPal order payload with proper amount breakdown
      const orderPayload = {
        intent: "CAPTURE",
        application_context: {
          return_url: `${baseUrl}/payment-complete?orderId=${orderId}&status=success&type=paypal`,
          cancel_url: `${baseUrl}/payment-complete?orderId=${orderId}&status=cancel&type=paypal`,
          brand_name: "Group Delivery Print",
          landing_page: "BILLING",
          shipping_preference: "SET_PROVIDED_ADDRESS",
          user_action: "PAY_NOW",
        },
        purchase_units: [
          {
            reference_id: orderId.toString(),
            amount: {
              currency_code: "USD",
              value: finalTotal.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: itemTotal.toFixed(2),
                },
                ...(taxAmount > 0 && {
                  tax_total: {
                    currency_code: "USD",
                    value: taxAmount.toFixed(2),
                  },
                }),
                ...(shippingAmount > 0 && {
                  shipping: {
                    currency_code: "USD",
                    value: shippingAmount.toFixed(2),
                  },
                }),
              },
            },
            items: items.map((item: any) => ({
              name: item.name || "Product",
              unit_amount: {
                currency_code: "USD",
                value: item.price.toFixed(2),
              },
              quantity: item.quantity.toString(),
              category: "PHYSICAL_GOODS",
            })),
            shipping: shippingInfo
              ? {
                  name: {
                    full_name: `${shippingInfo.firstName || ""} ${shippingInfo.lastName || ""}`.trim(),
                  },
                  address: {
                    address_line_1: shippingInfo.address || "",
                    admin_area_2: shippingInfo.city || "",
                    admin_area_1: shippingInfo.state || "",
                    postal_code: shippingInfo.zipCode || "",
                    country_code: "US",
                  },
                }
              : undefined,
          },
        ],
      }

      console.log("PayPal order payload:", JSON.stringify(orderPayload, null, 2))

      // Create PayPal order
      const order = await createPayPalOrder(accessToken, orderPayload)
      console.log("PayPal order created successfully:", order.id)

      // Store PayPal order in database using server client
      const { error: dbError } = await supabaseServer.from("paypal_transactions").insert({
        order_id: orderId,
        paypal_order_id: order.id,
        amount: finalTotal,
        status: "created",
        paypal_response: order,
        created_at: new Date().toISOString(),
      })

      if (dbError) {
        console.error("Database error:", dbError)
        // Don't fail the request for database errors, just log them
      }

      // Find the approval URL
      const approvalUrl = order.links?.find((link: any) => link.rel === "approve")?.href

      if (!approvalUrl) {
        console.error("No approval URL found in PayPal response")
        return NextResponse.json({ error: "PayPal approval URL not found" }, { status: 500 })
      }

      console.log("PayPal approval URL:", approvalUrl)

      return NextResponse.json({
        success: true,
        orderID: order.id,
        approvalUrl: approvalUrl,
        order: order,
      })
    } catch (paypalError: any) {
      console.error("PayPal API error:", paypalError)
      console.error("PayPal error details:", paypalError.message)

      return NextResponse.json(
        {
          error: "Failed to create PayPal order",
          details: paypalError.message || "Unknown PayPal error",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("PayPal create order error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
