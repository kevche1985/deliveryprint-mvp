"use client"

import { useRef, useState } from "react"
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayPalButtonProps {
  amount: number
  currency?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  orderId: string
  shippingInfo?: any
  billingInfo?: any
  shippingCost?: number
  taxAmount?: number
  onSuccess: (transactionId: string) => void
  onError?: (error: any) => void
  onCancel?: () => void
}

export default function PayPalButton({
  amount,
  currency = "USD",
  items = [],
  orderId,
  shippingInfo,
  billingInfo,
  shippingCost = 0,
  taxAmount = 0,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const paypalRef = useRef(null)

  // Calculate item total (sum of all items without shipping)
  const calculateItemTotal = () => {
    return items.reduce((total, item) => {
      return total + Number.parseFloat(item.price.toString()) * item.quantity
    }, 0)
  }

  const itemTotal = calculateItemTotal()

  // Format items for PayPal with exact precision
  const itemsFormatted = items.map((item) => ({
    name: item.name,
    quantity: item.quantity.toString(),
    unit_amount: {
      currency_code: currency,
      value: item.price.toFixed(2),
    },
  }))

  // Handle successful payment
  const handlePaymentSuccess = async (details: any) => {
    try {
      setProcessing(true)
      console.log("Payment successful, recording transaction:", details)

      // Record the transaction in our database
      const response = await fetch("/api/payments/paypal/record-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          paypalOrderId: details.id,
          paypalTransactionId: details.purchase_units[0]?.payments?.captures?.[0]?.id,
          amount: amount,
          status: details.status,
          paypalResponse: details,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record transaction")
      }

      const data = await response.json()
      console.log("Transaction recorded:", data)

      // Call the success callback with the transaction ID
      const transactionId = details.purchase_units[0]?.payments?.captures?.[0]?.id || details.id
      onSuccess(transactionId)

      toast({
        title: "Payment Successful",
        description: "Your PayPal payment has been processed successfully.",
      })
    } catch (err: any) {
      console.error("Error recording transaction:", err)
      setError("Payment was successful, but there was an issue recording the transaction.")

      // Still call success since the payment itself was successful
      const transactionId = details.purchase_units[0]?.payments?.captures?.[0]?.id || details.id
      onSuccess(transactionId)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>
      )}

      {processing && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Processing payment...</span>
        </div>
      )}

      <PayPalScriptProvider
        options={{
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          currency,
          intent: "capture",
        }}
      >
        {!loaded && !processing && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        )}

        <div className={!loaded || processing ? "invisible h-0" : ""}>
          <PayPalButtons
            ref={paypalRef}
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "pay",
            }}
            forceReRender={[amount, currency, items, orderId]}
            onInit={() => setLoaded(true)}
            createOrder={async (data, actions) => {
              try {
                console.log("Creating PayPal order for amount:", amount)

                // Create the order with proper breakdown
                const order = {
                  purchase_units: [
                    {
                      reference_id: orderId.toString(),
                      amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                        breakdown: {
                          item_total: {
                            currency_code: currency,
                            value: itemTotal.toFixed(2),
                          },
                        },
                      },
                    },
                  ],
                  application_context: {
                    shipping_preference: shippingInfo ? "SET_PROVIDED_ADDRESS" : "NO_SHIPPING",
                  },
                }

                // Add shipping if present
                if (shippingCost > 0) {
                  order.purchase_units[0].amount.breakdown.shipping = {
                    currency_code: currency,
                    value: shippingCost.toFixed(2),
                  }
                }

                // Add tax if present
                if (taxAmount > 0) {
                  order.purchase_units[0].amount.breakdown.tax_total = {
                    currency_code: currency,
                    value: taxAmount.toFixed(2),
                  }
                }

                // Add items if present
                if (itemsFormatted.length > 0) {
                  order.purchase_units[0].items = itemsFormatted
                }

                // Add shipping address if present
                if (shippingInfo) {
                  order.purchase_units[0].shipping = {
                    name: {
                      full_name: `${shippingInfo.firstName || ""} ${shippingInfo.lastName || ""}`.trim(),
                    },
                    address: {
                      address_line_1: shippingInfo.address || "",
                      admin_area_2: shippingInfo.city || "",
                      admin_area_1: shippingInfo.state || "",
                      postal_code: shippingInfo.zipCode || "",
                      country_code: "US", // Default to US
                    },
                  }
                }

                console.log("Creating PayPal order:", JSON.stringify(order, null, 2))
                return await actions.order.create(order)
              } catch (err: any) {
                console.error("PayPal create order error:", err)
                setError(err.message || "Payment error occurred")
                if (onError) onError(err)
                throw err
              }
            }}
            onApprove={async (data, actions) => {
              try {
                if (!actions.order) {
                  throw new Error("Order object is undefined")
                }

                const details = await actions.order.capture()
                console.log("Payment captured:", details)

                // Handle successful payment
                await handlePaymentSuccess(details)
              } catch (err: any) {
                console.error("PayPal capture error:", err)
                setError(err.message || "Payment processing error occurred")
                if (onError) onError(err)
              }
            }}
            onCancel={() => {
              console.log("Payment cancelled")
              if (onCancel) onCancel()
            }}
            onError={(err) => {
              console.error("PayPal error:", err)
              setError(err.message || "Payment error occurred")
              if (onError) onError(err)
            }}
          />
        </div>
      </PayPalScriptProvider>
    </div>
  )
}
