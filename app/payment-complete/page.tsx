"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PaymentCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingDetails, setProcessingDetails] = useState<string | null>(null)

  const orderId = searchParams.get("orderId")
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const paypalOrderId = searchParams.get("token") // PayPal returns this as 'token'

  useEffect(() => {
    const handlePaymentCompletion = async () => {
      if (!orderId) {
        setError("Missing order ID")
        setLoading(false)
        return
      }

      if (status === "success" && type === "paypal" && paypalOrderId) {
        try {
          console.log("Capturing PayPal payment:", { paypalOrderId, orderId })
          setProcessingDetails("Verifying payment with PayPal...")

          // Capture the PayPal payment
          const response = await fetch("/api/payments/paypal/capture-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderID: paypalOrderId,
              orderId: orderId,
            }),
          })

          // Log the raw response for debugging
          const responseText = await response.text()
          console.log("PayPal capture response status:", response.status)
          console.log("PayPal capture response text:", responseText)

          let data
          try {
            data = JSON.parse(responseText)
          } catch (e) {
            console.error("Failed to parse response as JSON:", e)
            throw new Error(`Invalid response from server: ${responseText}`)
          }

          if (data.success) {
            setProcessingDetails("Payment confirmed! Updating your order...")
            setSuccess(true)
            toast({
              title: "Payment Successful",
              description: "Your PayPal payment has been processed successfully.",
            })
          } else {
            throw new Error(data.error || data.details || "Failed to capture payment")
          }
        } catch (err: any) {
          console.error("Payment capture error:", err)
          setError(err.message || "Failed to process payment")
          toast({
            title: "Payment Error",
            description: err.message || "Failed to process your payment.",
            variant: "destructive",
          })
        }
      } else if (status === "success") {
        // For other payment types that are already processed
        setSuccess(true)
      } else if (status === "cancel" && type === "paypal") {
        setError("Payment was cancelled")
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the PayPal payment process.",
          variant: "destructive",
        })
      } else {
        setError("Payment was cancelled or failed")
      }

      setLoading(false)
    }

    handlePaymentCompletion()
  }, [orderId, status, type, paypalOrderId, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-600 text-center">
              {processingDetails || "Please wait while we confirm your payment..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className={success ? "text-green-700" : "text-red-700"}>
            {success ? "Payment Successful!" : "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success ? (
            <>
              <p className="text-gray-600">
                Your payment has been processed successfully. You will receive a confirmation email shortly.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(`/orders/${orderId}/confirmation`)}
                  className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                >
                  View Order Details
                </Button>
                <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                  View All Orders
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">{error || "There was an issue processing your payment."}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/checkout")} className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
                  Try Again
                </Button>
                <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                  View Orders
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
