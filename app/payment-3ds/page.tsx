"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

export default function Payment3DSPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<"pending" | "success" | "failed" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const transactionId = searchParams.get("id")
  const orderId = searchParams.get("orderId")
  const result = searchParams.get("result") // success, failed, cancelled

  useEffect(() => {
    if (!transactionId || !orderId) {
      setStatus("error")
      setErrorMessage("Missing transaction information")
      setLoading(false)
      return
    }

    // Handle the 3DS result
    const handle3DSResult = async () => {
      try {
        if (result === "success") {
          setVerifying(true)

          // Verify the transaction with Wompi API
          const verifyResponse = await fetch("/api/payments/wompi/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transactionId,
              orderId,
            }),
          })

          const verifyData = await verifyResponse.json()

          if (verifyData.success) {
            const transactionStatus = verifyData.status

            if (transactionStatus === "EXITOSO" || transactionStatus === "APROBADO") {
              setStatus("success")
              toast({
                title: t("payment.success.title"),
                description: t("payment.success.description"),
              })

              // Redirect to order confirmation after a short delay
              setTimeout(() => {
                router.push(`/orders/${orderId}/confirmation?status=success&transaction=${transactionId}`)
              }, 2000)
            } else if (transactionStatus === "RECHAZADO" || transactionStatus === "FALLIDO") {
              setStatus("failed")
              setErrorMessage(getErrorMessage(verifyData.data?.codigoRespuesta))
            } else {
              setStatus("failed")
              setErrorMessage("Payment verification failed")
            }
          } else {
            setStatus("failed")
            setErrorMessage(verifyData.error || "Verification failed")
          }
        } else if (result === "failed") {
          setStatus("failed")
          setErrorMessage("Payment was declined")
        } else if (result === "cancelled") {
          setStatus("failed")
          setErrorMessage("Payment was cancelled")
        } else {
          setStatus("error")
          setErrorMessage("Unknown payment result")
        }
      } catch (error) {
        console.error("3DS verification error:", error)
        setStatus("error")
        setErrorMessage("Failed to verify payment")
      } finally {
        setLoading(false)
        setVerifying(false)
      }
    }

    handle3DSResult()
  }, [transactionId, orderId, result, router, toast, t])

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "01":
        return t("payment.errors.insufficientFunds")
      case "05":
        return t("payment.errors.declined")
      case "54":
        return t("payment.errors.expiredCard")
      case "61":
        return t("payment.errors.limitExceeded")
      case "62":
        return t("payment.errors.restrictedCard")
      default:
        return t("payment.errors.generic")
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />
      case "failed":
      case "error":
        return <XCircle className="h-16 w-16 text-red-500" />
      default:
        return <CreditCard className="h-16 w-16 text-blue-500" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return t("payment.3ds.success.title")
      case "failed":
        return t("payment.3ds.failed.title")
      case "error":
        return t("payment.3ds.error.title")
      default:
        return t("payment.3ds.processing.title")
    }
  }

  const getStatusMessage = () => {
    if (verifying) {
      return t("payment.3ds.verifying")
    }

    switch (status) {
      case "success":
        return t("payment.3ds.success.message")
      case "failed":
        return errorMessage || t("payment.3ds.failed.message")
      case "error":
        return errorMessage || t("payment.3ds.error.message")
      default:
        return t("payment.3ds.processing.message")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {loading || verifying ? <Loader2 className="h-16 w-16 animate-spin text-blue-500" /> : getStatusIcon()}
          </div>
          <CardTitle
            className={
              status === "success"
                ? "text-green-700"
                : status === "failed" || status === "error"
                  ? "text-red-700"
                  : "text-blue-700"
            }
          >
            {getStatusTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{getStatusMessage()}</p>

          {!loading && !verifying && (
            <div className="space-y-2">
              {status === "success" ? (
                <>
                  <Button
                    onClick={() => router.push(`/orders/${orderId}/confirmation`)}
                    className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                  >
                    {t("payment.3ds.viewOrder")}
                  </Button>
                  <Button onClick={() => router.push("/orders")} variant="outline" className="w-full">
                    {t("payment.3ds.viewAllOrders")}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => router.push("/checkout")} className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
                    {t("payment.3ds.tryAgain")}
                  </Button>
                  <Button onClick={() => router.push("/products")} variant="outline" className="w-full">
                    {t("payment.3ds.continueShopping")}
                  </Button>
                </>
              )}
            </div>
          )}

          {transactionId && (
            <p className="text-xs text-gray-500">
              {t("payment.3ds.transactionId")}: {transactionId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
