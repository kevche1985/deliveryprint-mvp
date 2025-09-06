"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderData {
  total: number
  billingInfo: any
  shippingInfo: any
  items: any[]
  orderId: string
}

interface PayPalPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: OrderData
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
}

export default function PayPalPaymentModal({
  isOpen,
  onClose,
  orderData,
  onSuccess,
  onError,
}: PayPalPaymentModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"login" | "confirm" | "processing">("login")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [paypalPassword, setPaypalPassword] = useState("")

  const handlePayPalLogin = async () => {
    if (!paypalEmail || !paypalPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter your PayPal email and password.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate PayPal login validation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    setStep("confirm")
  }

  const handlePayPalPayment = async () => {
    setLoading(true)
    setStep("processing")

    try {
      const response = await fetch("/api/payments/paypal/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: orderData.total,
          orderId: orderData.orderId,
          items: orderData.items,
          billingInfo: orderData.billingInfo,
          shippingInfo: orderData.shippingInfo,
          paypalEmail: paypalEmail,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment processing failed")
      }

      if (result.success) {
        toast({
          title: "Payment Successful",
          description: "Your PayPal payment has been processed successfully.",
        })
        onSuccess(result.transactionId)
      } else {
        throw new Error(result.error || "Payment failed")
      }
    } catch (error) {
      console.error("PayPal payment error:", error)
      onError(error instanceof Error ? error.message : "Payment processing failed")
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep("login")
    setPaypalEmail("")
    setPaypalPassword("")
    setLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">PP</span>
            </div>
            PayPal Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security badge */}
          <div className="flex items-center justify-center gap-4 py-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Shield className="h-3 w-3" />
              Secure PayPal Payment
            </div>
          </div>

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total:</span>
                  <span className="text-lg font-bold">${orderData.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {orderData.items.length} item(s) • Order #{orderData.orderId}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PayPal Login Step */}
          {step === "login" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium">Log in to your PayPal account</h3>
                <p className="text-sm text-gray-600 mt-1">Enter your PayPal credentials to complete the payment</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="paypal-email">PayPal Email</Label>
                  <Input
                    id="paypal-email"
                    type="email"
                    placeholder="your@email.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="paypal-password">PayPal Password</Label>
                  <Input
                    id="paypal-password"
                    type="password"
                    placeholder="Enter your password"
                    value={paypalPassword}
                    onChange={(e) => setPaypalPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handlePayPalLogin} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">For testing: Use any email and password</p>
            </div>
          )}

          {/* Payment Confirmation Step */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Logged in as {paypalEmail}</span>
                </div>
                <p className="text-sm text-gray-600">Review your payment details and confirm</p>
              </div>

              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium">PayPal Balance</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-bold">${orderData.total.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merchant:</span>
                      <span>Group Delivery Print</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("login")} disabled={loading} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handlePayPalPayment}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Pay ${orderData.total.toFixed(2)}
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h3 className="font-medium mb-2">Processing Payment</h3>
                <p className="text-sm text-gray-600">Please wait while we process your PayPal payment...</p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center">
            Your payment is processed securely by PayPal. We do not store your payment information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
