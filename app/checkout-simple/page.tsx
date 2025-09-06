"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import countriesData from "@/lib/countries-regions.json"

const shippingMethods = [
  { id: "standard", name: "Regular Shipping", price: 3, description: "5-7 business days" },
  { id: "express", name: "Priority Shipping", price: 5, description: "3-5 business days" },
  { id: "overnight", name: "Urgent Shipping", price: 10, description: "1-2 business days" },
  { id: "pickup", name: "Store Pickup", price: 0, description: "Pick up at our store" },
]

const paymentMethods = [
  {
    id: "wompi",
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, American Express",
    icon: <CreditCard className="h-5 w-5" />,
  },
  { id: "paypal", name: "PayPal", description: "PayPal Account" },
  { id: "cash", name: "Cash on Delivery", description: "Pay when you receive" },
]

// Mock cart items for testing
const mockCartItems = [
  { id: 1, name: "Custom T-Shirt", price: 0.99, quantity: 1 },
  
]

export default function SimpleCheckoutPage() {
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(false)
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("wompi")
  const [selectedCountry, setSelectedCountry] = useState("SV")
  const [selectedRegion, setSelectedRegion] = useState("")

  const [billingInfo, setBillingInfo] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+503 1234-5678",
    address: "123 Main Street",
    city: "San Salvador",
    zipCode: "01101",
  })

  const [cardInfo, setCardInfo] = useState({
    cardNumber: "4111111111111111",
    expiryMonth: "12",
    expiryYear: "2025",
    cvv: "123",
  })

  // Calculations
  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethod)
  const shippingCost = selectedShipping?.price || 0
  const taxRate = 0.13
  const taxAmount = subtotal * taxRate
  const total = subtotal + shippingCost + taxAmount

  // Get regions for selected country
  const selectedCountryData = countriesData.countries.find((country) => country.id === selectedCountry)
  const regions = selectedCountryData?.territorios || []

  // Event handlers
  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId)
    setSelectedRegion("") // Reset region when country changes
  }

  const handleSubmitOrder = async () => {
    setLoading(true)

    try {
      if (paymentMethod === "wompi") {
        // Prepare Wompi payment data
        const wompiData = {
          tarjetaCreditoDebido: {
            numeroTarjeta: cardInfo.cardNumber.replace(/\s/g, ""),
            cvv: cardInfo.cvv,
            mesVencimiento: Number.parseInt(cardInfo.expiryMonth),
            anioVencimiento: Number.parseInt(cardInfo.expiryYear),
          },
          monto: total,
          nombre: billingInfo.firstName,
          apellido: billingInfo.lastName,
          email: billingInfo.email,
          telefono: billingInfo.phone,
          direccion: billingInfo.address,
          ciudad: billingInfo.city,
          idRegion: selectedRegion,
          codigoPostal: billingInfo.zipCode,
          idPais: selectedCountry,
          urlRedirect: `${window.location.origin}/payment-complete`,
          configuracion: {
            emailsNotificacion: billingInfo.email,
            telefonosNotificacion: billingInfo.phone,
            notificarTransaccionCliente: true,
            urlWebhook: `${window.location.origin}/api/payments/wompi/webhook`,
          },
          datosAdicionales: {
            items: mockCartItems,
            shippingMethod: shippingMethod,
          },
          idExterno: `ORDER-${Date.now()}`,
        }

        console.log("🚀 Sending Wompi payment request...")

        const response = await fetch("/api/payments/wompi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(wompiData),
        })

        const result = await response.json()
        console.log("📡 Wompi response:", result)

        if (result.success) {
          if (result.data?.urlCompletarPago3Ds) {
            // 3DS authentication required
            toast({
              title: "3DS Authentication Required",
              description: "Redirecting to secure authentication...",
            })
            window.location.href = result.data.urlCompletarPago3Ds
          } else {
            // Payment successful
            toast({
              title: "Payment Successful!",
              description: `Transaction ID: ${result.data?.idTransaccion}`,
            })
            // Redirect to success page
            window.location.href = `/payment-complete?status=success&transaction=${result.data?.idTransaccion}`
          }
        } else {
          throw new Error(result.error || "Payment failed")
        }
      } else {
        // Handle other payment methods
        toast({
          title: "Payment Method Not Implemented",
          description: `${paymentMethod} payment is not yet implemented in this demo.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple Checkout</h1>
          <p className="text-gray-600">Test the payment integration without authentication</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Enter your billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={billingInfo.firstName}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={billingInfo.lastName}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={billingInfo.email}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={billingInfo.phone}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={billingInfo.address}
                    onChange={handleBillingInfoChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={selectedCountry} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
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
                  <div className="space-y-2">
                    <Label htmlFor="region">State/Province *</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
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
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postal Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={billingInfo.zipCode}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" value={billingInfo.city} onChange={handleBillingInfoChange} required />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Method</CardTitle>
                <CardDescription>Choose your delivery option</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between border rounded-lg p-4 mb-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value={method.id} id={`shipping-${method.id}`} className="mr-3" />
                        <div>
                          <Label htmlFor={`shipping-${method.id}`} className="font-medium">
                            {method.name}
                          </Label>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        {method.price === 0 ? "FREE" : `$${method.price.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your payment option</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center border rounded-lg p-4 mb-2 hover:bg-gray-50">
                      <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mr-3" />
                      <div className="flex items-center gap-3">
                        {method.icon && <div className="text-gray-600">{method.icon}</div>}
                        <div>
                          <Label htmlFor={`payment-${method.id}`} className="font-medium">
                            {method.name}
                          </Label>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {/* Card Details (only show for Wompi) */}
                {paymentMethod === "wompi" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Card Details</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number *</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          value={cardInfo.cardNumber}
                          onChange={handleCardInfoChange}
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Test cards: 4111111111111111 (success), 4111111111110000 (insufficient funds)
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryMonth">Month *</Label>
                          <Input
                            id="expiryMonth"
                            name="expiryMonth"
                            value={cardInfo.expiryMonth}
                            onChange={handleCardInfoChange}
                            placeholder="12"
                            maxLength={2}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryYear">Year *</Label>
                          <Input
                            id="expiryYear"
                            name="expiryYear"
                            value={cardInfo.expiryYear}
                            onChange={handleCardInfoChange}
                            placeholder="2025"
                            maxLength={4}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            value={cardInfo.cvv}
                            onChange={handleCardInfoChange}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {mockCartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2">
                      <span>
                        {item.name} <span className="text-gray-500">x {item.quantity}</span>
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (13%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                    onClick={handleSubmitOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Complete Order • $${total.toFixed(2)}`
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>Test Card Numbers:</strong>
                  </p>
                  <p>• 4111111111111111 - Success</p>
                  <p>• 4111111111110000 - Insufficient funds</p>
                  <p>• 4111111111111111 - Card declined</p>
                  <p>• 4111111111113333 - Expired card</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
