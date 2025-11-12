"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

export default function PaymentCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()
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
        setError(t("common.error"))
        setLoading(false)
        return
      }

      if (status === "success" && type === "paypal" && paypalOrderId) {
        try {
          console.log("Capturing PayPal payment:", { paypalOrderId, orderId })
          setProcessingDetails(t("payment.3ds.verifying"))

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
            setProcessingDetails(t("payment.3ds.processing.title"))
            setSuccess(true)
            toast({
              title: t("payment.success.title"),
              description: t("payment.3ds.success.message"),
            })
          } else {
            throw new Error(data.error || data.details || "Failed to capture payment")
          }
        } catch (err: any) {
          console.error("Payment capture error:", err)
          setError(err.message || t("payment.error.processingFailed"))
          toast({
            title: t("payment.error.title"),
            description: err.message || t("payment.error.processingFailed"),
            variant: "destructive",
          })
        }
      } else if (status === "success") {
        // For other payment types that are already processed
        setSuccess(true)
      } else if (status === "cancel" && type === "paypal") {
        setError(t("common.error"))
      } else {
        setError(t("payment.3ds.failed.message"))
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
            <h2 className="text-lg font-semibold mb-2">{t("payment.3ds.processing.title")}</h2>
            <p className="text-gray-600 text-center">
              {processingDetails || t("payment.3ds.processing.message")}
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
            {success ? t("payment.3ds.success.title") : t("payment.3ds.failed.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success ? (
            <>
              <p className="text-gray-600">{t("payment.3ds.success.message")}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push(`/orders/${orderId}/confirmation`)}
                  className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                >
                  {t("payment.3ds.viewOrder")}
                </Button>
                <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                  {t("payment.3ds.viewAllOrders")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">{error || t("payment.3ds.failed.message")}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/checkout")} className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
                  {t("payment.3ds.tryAgain")}
                </Button>
                <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                  {t("payment.3ds.viewAllOrders")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
