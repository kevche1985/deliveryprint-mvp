"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CreditCard, Lock, Shield, Info, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/language-context"
import countriesData from "@/lib/countries-regions.json"

interface OrderData {
  total: number
  billingInfo: any
  shippingInfo: any
  items: any[]
  orderId: string
  userId?: string
}

interface WompiPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: OrderData
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
}

export default function WompiPaymentModal({ isOpen, onClose, orderData, onSuccess, onError }: WompiPaymentModalProps) {
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  })
  const [selectedCountry, setSelectedCountry] = useState("SV")
  const [selectedRegion, setSelectedRegion] = useState("SV-SS")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get regions for selected country
  const selectedCountryData = countriesData.countries.find((country) => country.id === selectedCountry)
  const regions = selectedCountryData?.territorios || []

  // Clear general error when user makes changes
  const clearGeneralError = () => {
    if (errors.general) {
      const { general, ...rest } = errors
      setErrors(rest)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCardData({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        cardholderName: "",
      })
      setErrors({})

      // Set default country and region based on billing info
      const billingCountry = orderData.billingInfo?.country
      if (billingCountry === "Canada") {
        setSelectedCountry("CA")
        setSelectedRegion("CA-ON") // Default to Ontario
      } else if (billingCountry === "United States" || billingCountry === "USA") {
        setSelectedCountry("US")
        setSelectedRegion("US-CA") // Default to California
      } else {
        setSelectedCountry("SV")
        setSelectedRegion("SV-SS") // Default to San Salvador
      }
    }
  }, [isOpen, orderData.billingInfo])

  // Update region when country changes
  useEffect(() => {
    if (regions.length > 0) {
      setSelectedRegion(regions[0].id)
    }
  }, [selectedCountry, regions])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  // Detect card type
  const getCardType = (number: string) => {
    const num = number.replace(/\s/g, "")
    if (/^4/.test(num)) return "visa"
    if (/^5[1-5]/.test(num)) return "mastercard"
    if (/^3[47]/.test(num)) return "amex"
    if (/^6/.test(num)) return "discover"
    return "unknown"
  }

  // Get test scenario info (Wompi test mode uses CVV: "111" -> declined, any other CVV -> success)
  const getTestScenario = (cvv: string) => {
    if (!cvv) return null
    if (cvv === "111") {
      return { type: "error", message: t("payment.testCard.declined") }
    }
    return { type: "success", message: t("payment.testCard.othersSuccess") }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = t("payment.validation.cardNumber")
    }

    if (!cardData.expiryMonth || !cardData.expiryYear) {
      newErrors.expiry = t("payment.validation.expiry")
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = t("payment.validation.cvv")
    }

    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = t("payment.validation.cardholderName")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Prepare payment data for Wompi API
      const paymentData = {
        tarjetaCreditoDebido: {
          numeroTarjeta: cardData.cardNumber.replace(/\s/g, ""),
          cvv: cardData.cvv,
          mesVencimiento: Number.parseInt(cardData.expiryMonth),
          anioVencimiento: Number.parseInt(cardData.expiryYear),
        },
        monto: orderData.total,
        nombre: orderData.billingInfo.firstName,
        apellido: orderData.billingInfo.lastName,
        email: orderData.billingInfo.email,
        telefono: orderData.billingInfo.phone || "70000000",
        direccion: orderData.billingInfo.address,
        ciudad: orderData.billingInfo.city,
        idRegion: selectedRegion,
        codigoPostal: orderData.billingInfo.zipCode || "01101",
        idPais: selectedCountry,
        urlRedirect: `${window.location.origin}/payment-complete?orderId=${orderData.orderId}&status=success`,
        configuracion: {
          emailsNotificacion: orderData.billingInfo.email,
          telefonosNotificacion: orderData.billingInfo.phone || "70000000",
          notificarTransaccionCliente: true,
          urlWebhook: `${window.location.origin}/api/payments/wompi/webhook`,
        },
        idExterno: orderData.orderId,
        datosAdicionales: {
          items: orderData.items,
          shippingInfo: orderData.shippingInfo,
        },
      }

      console.log("💳 Sending payment request...")

      // Add timeout protection for frontend request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log("⏰ Payment request timed out after 45 seconds")
      }, 45000) // 45 second timeout (longer than backend)

      const response = await fetch("/api/payments/wompi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      })
      
      // Clear timeout on response
      clearTimeout(timeoutId)

      const responseText = await response.text()
      console.log("📡 Response:", responseText)

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.status} - ${responseText}`)
      }

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid response format: ${responseText}`)
      }

      if (responseData.success) {
        if (responseData.requiresAuth && responseData.data?.urlCompletarPago3Ds) {
          // 3DS authentication required - redirect to Wompi's 3DS page
          console.log("🔐 Redirecting to 3DS authentication...")

          // Add our return URL parameters to the 3DS URL
          const threeDSUrl = new URL(responseData.data.urlCompletarPago3Ds)
          threeDSUrl.searchParams.set(
            "returnUrl",
            `${window.location.origin}/payment-3ds?id=${responseData.data.idTransaccion}&orderId=${orderData.orderId}`,
          )

          // Close modal before redirect
          onClose()

          // Redirect to 3DS authentication
          window.location.href = threeDSUrl.toString()
        } else if (responseData.data?.idTransaccion) {
          // Payment successful without 3DS
          console.log("✅ Payment successful!")
          const transactionId = responseData.data.idTransaccion

          // Call payment confirmation API to update digital products
          try {
            const confirmResponse = await fetch("/api/payments/confirm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: orderData.orderId,
                transactionId: transactionId,
                paymentMethod: "wompi",
                cartItems: orderData.items.filter((item: any) => !item.digitalProductId),
                digitalCartItems: orderData.items.filter(
                  (item: any) =>
                    item.digitalProductId ||
                    (item.productId &&
                      typeof item.productId === "string" &&
                      (item.productId.startsWith("logo-") ||
                        item.productId.startsWith("font-") ||
                        item.productId.startsWith("image-")))
                ),
                userId: orderData.userId,
              }),
            })

            if (!confirmResponse.ok) {
              console.error("Failed to confirm payment for digital products")
            } else {
              console.log("Successfully confirmed payment and updated digital products")
            }
          } catch (confirmError) {
            console.error("Error confirming payment:", confirmError)
          }

          toast({
            title: t("payment.success.title"),
            description: `${t("payment.success.transactionId")}: ${transactionId}`,
          })
          onSuccess(transactionId)
        } else {
          throw new Error("Invalid payment response")
        }
      } else {
        // Handle validation errors differently from other errors
        if (responseData.error === "validation_error" && responseData.canRetry) {
          console.log("🔄 Validation error - staying in form:", responseData.userMessage)
          
          // Show validation error in form instead of closing modal
          setErrors({ general: responseData.userMessage || "Please check your information and try again." })
          
          toast({
            title: "Validation Error",
            description: responseData.userMessage || "Please check your information and try again.",
            variant: "destructive",
          })
          
          return // Stay in the form, don't close modal
        }
        
        throw new Error(responseData.userMessage || responseData.error || t("payment.error.processingFailed"))
      }
    } catch (error) {
      console.error("❌ Payment error:", error)
      
      let errorMessage: string
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = "Payment request timed out. Please check your connection and try again."
      } else {
        errorMessage = error instanceof Error ? error.message : t("payment.error.processingFailed")
      }
      
      onError(errorMessage)
      toast({
        title: t("payment.error.title"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cardType = getCardType(cardData.cardNumber)
  const testScenario = getTestScenario(cardData.cvv)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("payment.modal.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Test Mode Alert - Based on Wompi Official Documentation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{t("payment.testMode.title")}:</strong> {t("payment.testMode.description")}
              <br />• <strong>CVV "111"</strong> = {t("payment.testCard.declined")}
              <br />• <strong>Any other CVV</strong> = {t("payment.testCard.othersSuccess")}
              <br />• <em>Note: Use any valid card number for testing</em>
            </AlertDescription>
          </Alert>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Lock className="h-3 w-3" />
              {t("payment.security.sslEncrypted")}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Shield className="h-3 w-3" />
              {t("payment.security.pciCompliant")}
            </div>
          </div>

          {/* General Error Display */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">{t("payment.form.cardNumber")} *</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => {
                  clearGeneralError()
                  setCardData((prev) => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value),
                  }))
                }}
                maxLength={19}
                className={errors.cardNumber ? "border-red-500" : ""}
              />
              {cardType !== "unknown" && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-xs font-medium text-gray-500 uppercase">{cardType}</span>
                </div>
              )}
            </div>
            {errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber}</p>}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">{t("payment.form.month")} *</Label>
              <Select
                value={cardData.expiryMonth}
                onValueChange={(value) => setCardData((prev) => ({ ...prev, expiryMonth: value }))}
              >
                <SelectTrigger className={errors.expiry ? "border-red-500" : ""}>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, "0")
                    return (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">{t("payment.form.year")} *</Label>
              <Select
                value={cardData.expiryYear}
                onValueChange={(value) => setCardData((prev) => ({ ...prev, expiryYear: value }))}
              >
                <SelectTrigger className={errors.expiry ? "border-red-500" : ""}>
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString()
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">{t("payment.form.cvv")} *</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => {
                  clearGeneralError()
                  setCardData((prev) => ({
                    ...prev,
                    cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }}
                maxLength={4}
                className={errors.cvv ? "border-red-500" : ""}
              />
              {testScenario && (
                <p
                  className={`text-xs ${testScenario.type === "success" ? "text-green-600" : testScenario.type === "info" ? "text-blue-600" : "text-orange-600"}`}
                >
                  {testScenario.message}
                </p>
              )}
            </div>
          </div>
          {errors.expiry && <p className="text-sm text-red-500">{errors.expiry}</p>}
          {errors.cvv && <p className="text-sm text-red-500">{errors.cvv}</p>}

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">{t("payment.form.cardholderName")} *</Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              value={cardData.cardholderName}
              onChange={(e) => {
                clearGeneralError()
                setCardData((prev) => ({
                  ...prev,
                  cardholderName: e.target.value,
                }))
              }}
              className={errors.cardholderName ? "border-red-500" : ""}
            />
            {errors.cardholderName && <p className="text-sm text-red-500">{errors.cardholderName}</p>}
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">{t("payment.form.country")} *</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countriesData.countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Selection */}
          <div className="space-y-2">
            <Label htmlFor="region">{t("payment.form.region")} *</Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("payment.summary.totalToPay")}:</span>
                <span className="text-lg font-bold">${orderData.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#8B0000] hover:bg-[#6B0000]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("payment.processing")}...
                </>
              ) : (
                `${t("payment.payButton")} $${orderData.total.toFixed(2)}`
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center">{t("payment.security.notice")}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
