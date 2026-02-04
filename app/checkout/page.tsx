"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard, AlertCircle, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { useToast } from "@/hooks/use-toast"
import { createOrder } from "@/lib/database"
import WompiPaymentModal from "@/components/wompi-payment-modal"
import PayPalButton from "@/components/paypal-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/language-context"
import { track } from "@/lib/analytics"

const shippingMethods = [
  { id: "standard", name: "Regular Shipping", price: 3, description: "5-7 business days", value: "standard" },
  { id: "express", name: "Priority Shipping", price: 5, description: "3-5 business days", value: "express" },
  { id: "overnight", name: "Urgent Shipping", price: 10, description: "1-2 business days", value: "overnight" },
  { id: "pickup", name: "Store Pickup", price: 0, description: "Pick up at our store", value: "pickup" },
]

// Add this after the shippingMethods constant
const digitalShippingMethods = [
  {
    id: "download",
    name: "Digital Download",
    price: 0,
    description: "Instant download after payment",
    value: "download",
    icon: <Download className="h-4 w-4" />,
  },
]

const paymentMethods = [
  {
    id: "wompi",
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, American Express",
    value: "wompi",
    icon: <CreditCard className="h-5 w-5" />,
  },
  { id: "paypal", name: "PayPal", description: "PayPal Account", value: "paypal" },
  { id: "stripe", name: "Stripe", description: "Credit/Debit Card", value: "stripe" },
  { id: "cash", name: "Cash on Delivery", description: "Pay when you receive", value: "cash" },
]

// Add this after the paymentMethods constant
export default function CheckoutPage() {
  const { t } = useLanguage()
  const [activePaymentMethods, setActivePaymentMethods] = useState(paymentMethods)
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const { items: digitalItems, subtotal: digitalSubtotal, clearCart: clearDigitalCart } = useDigitalCart()
  const { toast } = useToast()

  // ALL STATE HOOKS FIRST
  const [internalLoading, setInternalLoading] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [showWompiModal, setShowWompiModal] = useState(false)
  const [showPayPalButtons, setShowPayPalButtons] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("wompi")
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "El Salvador",
  })
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "El Salvador",
  })
  const [notes, setNotes] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isDigitalOnly, setIsDigitalOnly] = useState(false)

  // CALCULATIONS - Move these before they're used
  const taxRate = 0.13 // 13% VAT in El Salvador
  const selectedShipping = isDigitalOnly
    ? digitalShippingMethods.find((method) => method.id === shippingMethod)
    : shippingMethods.find((method) => method.id === shippingMethod)
  const shippingCost = selectedShipping?.price || 0
  const taxAmount = subtotal * taxRate
  const total = subtotal + shippingCost + taxAmount

  // Combined calculations
  const combinedItems = [...items, ...digitalItems]
  const combinedSubtotal = subtotal + digitalSubtotal
  const combinedTaxAmount = combinedSubtotal * taxRate
  const combinedTotal = combinedSubtotal + shippingCost + combinedTaxAmount

  // Format digital items to match the structure expected by PayPal
  const formattedDigitalItems = digitalItems.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: 1,
    price: item.finalPrice || item.basePrice || 0,
  }))

  // Combine regular items with formatted digital items
  const paypalItems = [...items, ...formattedDigitalItems]

  // Add this right after the calculations for debugging
  console.log("=== CHECKOUT DEBUG ===")
  console.log("Regular cart items:", items)
  console.log("Digital cart items:", digitalItems)
  console.log("Formatted digital items:", formattedDigitalItems)
  console.log("Combined items for PayPal:", paypalItems)
  console.log("Regular subtotal:", subtotal)
  console.log("Digital subtotal:", digitalSubtotal)
  console.log("Combined subtotal:", combinedSubtotal)
  console.log("=== END DEBUG ===")

  // ALL EFFECT HOOKS SECOND
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=checkout")
    }
  }, [loading, user, router])

  useEffect(() => {
    track("checkout_start", { items: items.length + digitalItems.length, subtotal: subtotal + digitalSubtotal })
  }, [])

  // Check if this is a digital-only order
  useEffect(() => {
    const digitalOnly = digitalItems.length > 0 && items.length === 0
    setIsDigitalOnly(digitalOnly)

    // If it's a digital-only order, set shipping method to download
    if (digitalOnly) {
      setShippingMethod("download")
    } else if (shippingMethod === "download") {
      // If it's not digital-only but shipping method is download, change to standard
      setShippingMethod("standard")
    }
  }, [digitalItems.length, items.length, shippingMethod])

  // Add this useEffect to fetch active payment providers
  useEffect(() => {
    const fetchActivePaymentProviders = async () => {
      try {
        const response = await fetch("/api/admin/payments/active")

        if (!response.ok) {
          console.warn("Failed to fetch active payment providers, using all methods")
          setActivePaymentMethods(paymentMethods)
          return
        }

        const activeProviders = await response.json()
        console.log("Active providers from API:", activeProviders)

        if (Array.isArray(activeProviders)) {
          const activeProviderNames = activeProviders.map((p) => p.provider_name)
          console.log("Active provider names:", activeProviderNames)

          // Create a mapping between database provider names and payment method IDs
          const providerMapping = {
            wompi: "wompi",
            paypal: "paypal",
            stripe: "stripe",
            cash_on_delivery: "cash",
          }

          // Filter payment methods to only show active ones
          const filteredMethods = paymentMethods.filter((method) => {
            // Always show cash option if cash_on_delivery is active
            if (method.id === "cash") {
              return activeProviderNames.includes("cash_on_delivery")
            }

            // For all other payment methods, check if they're active in the database
            const isActive = activeProviderNames.includes(method.id)
            console.log(`Payment method ${method.id} is ${isActive ? "active" : "inactive"}`)
            return isActive
          })

          console.log(
            "Filtered payment methods:",
            filteredMethods.map((m) => m.id),
          )
          setActivePaymentMethods(filteredMethods)
        } else {
          console.warn("Invalid response format, using all payment methods")
          setActivePaymentMethods(paymentMethods)
        }
      } catch (error) {
        console.error("Error fetching active payment providers:", error)
        // Fallback to all payment methods if there's an error
        setActivePaymentMethods(paymentMethods)
      }
    }

    fetchActivePaymentProviders()
  }, [])

  // Add this useEffect after the activePaymentMethods state is updated
  useEffect(() => {
    // If the currently selected payment method is not in the active list, select the first available one
    if (activePaymentMethods.length > 0 && !activePaymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(activePaymentMethods[0].id)
    }
  }, [activePaymentMethods, paymentMethod])

  // Fill in user information if available
  useEffect(() => {
    if (profile) {
      setBillingInfo((prev) => ({
        ...prev,
        firstName: profile.first_name || prev.firstName,
        lastName: profile.last_name || prev.lastName,
        email: profile.email || prev.email,
        phone: (profile as any)?.phone || prev.phone,
      }))
    }
  }, [profile])

  // Update shipping info when billing info changes and sameAsBilling is true
  useEffect(() => {
    if (sameAsBilling) {
      setShippingInfo({
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName,
        phone: billingInfo.phone,
        address: billingInfo.address,
        city: billingInfo.city,
        state: billingInfo.state,
        zipCode: billingInfo.zipCode,
        country: billingInfo.country,
      })
    }
  }, [billingInfo, sameAsBilling])

  // EVENT HANDLERS
  const handleBillingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBillingInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!user) {
      toast({
        title: t("checkout.toast.authRequiredTitle"),
        description: t("checkout.toast.authRequiredDesc"),
        variant: "destructive",
      })
      router.push("/auth/login?redirect=checkout")
      return false
    }

    // Replace the existing combinedItems check
    const hasItems = items.length > 0 || digitalItems.length > 0
    console.log(
      "Has items check:",
      hasItems,
      "items.length:",
      items.length,
      "digitalItems.length:",
      digitalItems.length,
    )

    // Then use this in the condition
    if (!hasItems) {
      toast({
        title: t("checkout.toast.emptyCartTitle"),
        description: t("checkout.toast.emptyCartDesc"),
        variant: "destructive",
      })
      router.push("/products")
      return false
    }

    if (!agreeToTerms) {
      toast({
        title: t("checkout.toast.termsTitle"),
        description: t("checkout.toast.termsDesc"),
        variant: "destructive",
      })
      return false
    }

    if (
      !billingInfo.firstName ||
      !billingInfo.lastName ||
      !billingInfo.email ||
      !billingInfo.phone ||
      !billingInfo.address ||
      !billingInfo.city ||
      !billingInfo.state ||
      !billingInfo.zipCode
    ) {
      toast({
        title: t("checkout.toast.missingInfoTitle"),
        description: t("checkout.toast.missingInfoDesc"),
        variant: "destructive",
      })
      return false
    }

    if (
      !isDigitalOnly &&
      !sameAsBilling &&
      (!shippingInfo.firstName ||
        !shippingInfo.lastName ||
        !shippingInfo.phone ||
        !shippingInfo.address ||
        !shippingInfo.city ||
        !shippingInfo.state ||
        !shippingInfo.zipCode)
    ) {
      toast({
        title: t("checkout.toast.missingInfoTitle"),
        description: t("checkout.toast.missingInfoDesc"),
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return
    }

    setInternalLoading(true)
    // Reset any previous PayPal errors
    setPaypalError(null)

    try {
      // For digital-only orders, add a special note
      const orderNotes = isDigitalOnly ? (notes ? `${notes} [DIGITAL DOWNLOAD]` : "[DIGITAL DOWNLOAD]") : notes

      const orderData = {
        user_id: user?.id || '',
        email: billingInfo.email,
        order_number: `ORD-${Date.now()}`,
        status: "pending",
        subtotal: combinedSubtotal,
        tax: combinedTaxAmount,
        shipping: shippingCost,
        discount: 0,
        total: combinedTotal,
        shipping_method: shippingMethod, // Now we can use "download" directly
        payment_method: paymentMethod,
        billing_address: billingInfo,
        shipping_address: sameAsBilling ? billingInfo : shippingInfo,
        notes: orderNotes,
        currency: "USD",
      }

      const order = await createOrder(orderData)
      track("order_created", { orderId: order.id, total: combinedTotal, method: paymentMethod })
      setCurrentOrder(order)

      // Create order items immediately (idempotent with payment confirm)
      try {
        const physicalOrderItems = items.map((item) => {
          const customizedProductImage = (item as any).customizations?.customDesign?.customizedProductImage || (item as any).customizations?.customizedProductImage || null
          const aiPreview = (item as any).customizations?.aiDesign?.previewUrl || null
          const previewUrl = (item as any).customizations?.preview_url || aiPreview || customizedProductImage || item.image || null
          const downloadUrl = (item as any).customizations?.download_url || (item as any).customizations?.storage_url || customizedProductImage || aiPreview || item.image || null
          const designId = (item as any).designId || (item as any).customizations?.design_id || undefined
          return {
            order_id: order.id,
            product_id: item.productId,
            variant_id: item.variantId || null,
            design_id: designId || null,
            quantity: item.quantity || 1,
            price: item.price || 0,
            name: item.name,
            product_image_url: item.image || null,
            design_image_url: previewUrl || null,
            design_file_url: downloadUrl || null,
            customized_image_url: customizedProductImage || null,
            print_ready_file_url: downloadUrl || null,
            digital_product_id: null,
            customizations: (item as any).customizations || null,
          }
        })
        for (const oi of physicalOrderItems) {
          await fetch(`/api/orders/${order.id}/items`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oi)
          })
        }

        const digitalOrderItems = digitalItems.map((d) => ({
          order_id: order.id,
          product_id: 'digital-product',
          digital_product_id: d.productId || d.designId,
          variant_id: null,
          design_id: null,
          name: d.name,
          quantity: 1,
          price: d.finalPrice || d.basePrice || 0,
          customizations: d.generationInputs || null,
          product_image_url: null,
          design_image_url: d.previewUrl || null,
          design_file_url: null,
          customized_image_url: d.previewUrl || null,
          print_ready_file_url: null,
        }))
        for (const oi of digitalOrderItems) {
          await fetch(`/api/orders/${order.id}/items`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(oi)
          })
        }
      } catch (e) {
        console.warn('Order items creation failed or partially succeeded:', e)
      }

      try {
        await fetch("/api/email/admin/new-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        })
      } catch (_) {}

      if (paymentMethod === "wompi") {
        setShowWompiModal(true)
      } else if (paymentMethod === "paypal") {
        console.log("Showing PayPal buttons for order:", order.id)
        setShowPayPalButtons(true)
      } else if (paymentMethod === "stripe") {
        setTimeout(() => {
          clearCart()
          clearDigitalCart()
          router.push(`/orders/${order.id}/confirmation?status=success`)
        }, 2000)
      } else {
        clearCart()
        clearDigitalCart()
        router.push(`/orders/${order.id}/confirmation?status=pending`)
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Order creation failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setInternalLoading(false)
    }
  }

  const handlePayPalSuccess = async (transactionId: string) => {
    try {
      // Extract digital product IDs from digital cart items
      const digitalProductIds = digitalItems.map((item) => item.productId || item.designId).filter(Boolean)

      console.log("PayPal payment successful, confirming with digital products:", digitalProductIds)

      // Call payment confirmation API
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: currentOrder.id,
          transactionId,
          paymentMethod: "paypal",
          paymentStatus: "completed",
          cartItems: items.map((item) => {
            const customizedProductImage = (item as any).customizations?.customDesign?.customizedProductImage || (item as any).customizations?.customizedProductImage || null
            const aiPreview = (item as any).customizations?.aiDesign?.previewUrl || null
            const previewUrl = (item as any).customizations?.preview_url || aiPreview || customizedProductImage || item.image || null
            const downloadUrl = (item as any).customizations?.download_url || (item as any).customizations?.storage_url || customizedProductImage || aiPreview || item.image || null
            const designId = (item as any).designId || (item as any).customizations?.design_id || undefined
            return {
              ...item,
              designId,
              productImage: item.image || null,
              customizedProductImage,
              design_image_url: previewUrl,
              design_file_url: downloadUrl,
              storageUrl: (item as any).customizations?.storage_url || null,
              preview_url: previewUrl,
              download_url: downloadUrl,
            }
          }),
          digitalCartItems: digitalItems.map((item) => ({
            ...item,
            productImage: null, // Digital items don't have base product images
          })),
          customerEmail: billingInfo.email || user?.email || '',
          shippingAddress: sameAsBilling ? billingInfo : shippingInfo,
          notes: notes,
          shippingMethod: shippingMethod,
          total: combinedTotal,
          subtotal: combinedSubtotal,
          tax: combinedTaxAmount,
          shipping: shippingCost,
          userId: user?.id,
        }),
      })

      // Check if response is JSON
      const contentType = confirmResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("API returned non-JSON response:", await confirmResponse.text())
        throw new Error("Server returned an invalid response format")
      }

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json()
        console.error("Payment confirmation failed. API Response:", errorData)
        throw new Error(errorData.error || "Payment confirmation failed")
      }

      const confirmationData = await confirmResponse.json()
      console.log("Payment confirmation successful:", confirmationData)

      toast({
        title: t("payment.success.title"),
        description: t("payment.3ds.success.message"),
      })

      clearCart()
      clearDigitalCart()
      router.push(`/orders/${currentOrder.id}/confirmation?status=success&transaction=${transactionId}`)
    } catch (error) {
      console.error("Error in PayPal confirmation:", error)
      toast({
        title: t("payment.error.title"),
        description: error instanceof Error ? error.message : t("payment.error.processingFailed"),
        variant: "destructive",
      })

      // Still redirect but with error flag
      clearCart()
      clearDigitalCart()
      router.push(
        `/orders/${currentOrder.id}/confirmation?status=success&transaction=${transactionId}&confirm_error=true`,
      )
    }
  }

  const handlePayPalError = (error: any) => {
    console.error("PayPal payment error:", error)
    setPaypalError(error.message || "There was an error processing your PayPal payment. Please try again.")
    toast({
      title: t("payment.3ds.failed.title"),
      description: error.message || t("payment.error.processingFailed"),
      variant: "destructive",
    })
  }

  const handlePayPalCancel = () => {
    console.log("PayPal payment cancelled")
    toast({
      title: t("common.cancel"),
      description: t("payment.error.processingFailed"),
    })
    setShowPayPalButtons(false)
  }

  const handleWompiSuccess = async (transactionId: string) => {
    try {
      // Extract digital product IDs from digital cart items
      const digitalProductIds = digitalItems.map((item) => item.productId || item.designId).filter(Boolean)

      console.log("Wompi payment successful, confirming with digital products:", digitalProductIds)

      // Call payment confirmation API
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: currentOrder.id,
          transactionId,
          paymentMethod: "wompi",
          paymentStatus: "completed",
          cartItems: items.map((item) => {
            const customizedProductImage = (item as any).customizations?.customDesign?.customizedProductImage || (item as any).customizations?.customizedProductImage || null
            const aiPreview = (item as any).customizations?.aiDesign?.previewUrl || null
            const previewUrl = (item as any).customizations?.preview_url || aiPreview || customizedProductImage || item.image || null
            const downloadUrl = (item as any).customizations?.download_url || (item as any).customizations?.storage_url || customizedProductImage || aiPreview || item.image || null
            const designId = (item as any).designId || (item as any).customizations?.design_id || undefined
            return {
              ...item,
              designId,
              productImage: item.image || null,
              customizedProductImage,
              design_image_url: previewUrl,
              design_file_url: downloadUrl,
              storageUrl: (item as any).customizations?.storage_url || null,
              preview_url: previewUrl,
              download_url: downloadUrl,
            }
          }),
          digitalCartItems: digitalItems.map((item) => ({
            ...item,
            productImage: null, // Digital items don't have base product images
          })),
          customerEmail: billingInfo.email || user?.email,
          shippingAddress: sameAsBilling ? billingInfo : shippingInfo,
          notes: notes,
          shippingMethod: shippingMethod,
          total: combinedTotal,
          subtotal: combinedSubtotal,
          tax: combinedTaxAmount,
          shipping: shippingCost,
          userId: user?.id,
        }),
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse
          .json()
          .catch(() => ({ error: "Failed to parse error response from API" }))
        console.error("Payment confirmation failed. API Response:", errorData)
      toast({
        title: t("payment.error.title"),
        description: errorData.error || t("payment.error.processingFailed"),
        variant: "destructive",
      })
        // Similar to PayPal, consider the flow on failure.
        // Original code proceeds to clear cart and redirect.
        clearCart()
        clearDigitalCart()
        router.push(
          `/orders/${currentOrder.id}/confirmation?status=success&transaction=${transactionId}&confirm_failed=true`,
        )
        return // Stop further execution
      }
      // If confirmResponse.ok, proceed with success logic
      const confirmationData = await confirmResponse.json()
      console.log("Payment confirmation successful. API Response:", confirmationData)

      toast({
        title: t("payment.success.title"),
        description: t("payment.3ds.success.message"),
      })
      clearCart()
      clearDigitalCart()
      router.push(`/orders/${currentOrder.id}/confirmation?status=success&transaction=${transactionId}`)
    } catch (error) {
      console.error("Error in payment confirmation:", error)
      // Still redirect to success page even if confirmation fails
      toast({
        title: t("payment.success.title"),
        description: t("payment.3ds.success.message"),
      })
      clearCart()
      clearDigitalCart()
      router.push(`/orders/${currentOrder.id}/confirmation?status=success&transaction=${transactionId}`)
    }
  }

  const handleWompiError = (error: string) => {
    toast({
      title: t("payment.3ds.failed.title"),
      description: error,
      variant: "destructive",
    })
  }

  // NOW HANDLE CONDITIONAL RENDERING AFTER ALL HOOKS

  // Update the shipping method selection logic
  const availableShippingMethods = isDigitalOnly ? digitalShippingMethods : shippingMethods

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const hasItems = items.length > 0 || digitalItems.length > 0
  console.log("Has items check:", hasItems, "items.length:", items.length, "digitalItems.length:", digitalItems.length)

  if (!hasItems) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("cart.empty")}</h1>
          <p className="mb-6">{t("cart.emptyDescription")}</p>
          <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
            <a href="/products">{t("cart.browseProducts")}</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("checkout.title")}</h1>
          <p className="text-gray-600">{t("checkout.subtitle")}</p>

          {isDigitalOnly && (
            <Alert className="mt-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t("checkout.digitalOrderTitle")}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{t("checkout.digitalOrderBadge")}</span>
              </div>
              <AlertDescription>
                {t("checkout.digitalOrderDescription")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {paypalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paypalError}</AlertDescription>
          </Alert>
        )}

        {showPayPalButtons && currentOrder ? (
          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("checkout.completePaymentWithPayPal")}</CardTitle>
                <CardDescription>{t("checkout.clickPayPalButtons")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span>{t("checkout.orderTotal")}</span>
                    <span className="font-bold">${combinedTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500">{t("checkout.orderNumberLabel")} {currentOrder.id}</div>
                </div>

                <PayPalButton
                  amount={combinedTotal}
                  items={paypalItems}
                  orderId={currentOrder.id}
                  shippingInfo={sameAsBilling ? billingInfo : shippingInfo}
                  billingInfo={billingInfo}
                  shippingCost={shippingCost}
                  taxAmount={combinedTaxAmount}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                  onCancel={handlePayPalCancel}
                />

                <Button variant="outline" className="w-full mt-4" onClick={() => setShowPayPalButtons(false)}>
                  {t("checkout.backToCheckout")}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Billing Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.billingTitle")}</CardTitle>
                  <CardDescription>{t("checkout.billingDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("checkout.firstName")}</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={billingInfo.firstName}
                        onChange={handleBillingInfoChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("checkout.lastName")}</Label>
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
                      <Label htmlFor="email">{t("checkout.email")}</Label>
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
                      <Label htmlFor="phone">{t("checkout.phone")}</Label>
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
                    <Label htmlFor="address">{t("checkout.address")}</Label>
                    <Input
                      id="address"
                      name="address"
                      value={billingInfo.address}
                      onChange={handleBillingInfoChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("checkout.city")}</Label>
                      <Input
                        id="city"
                        name="city"
                        value={billingInfo.city}
                        onChange={handleBillingInfoChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t("checkout.state")}</Label>
                      <Input
                        id="state"
                        name="state"
                        value={billingInfo.state}
                        onChange={handleBillingInfoChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{t("checkout.zipCode")}</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={billingInfo.zipCode}
                        onChange={handleBillingInfoChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("checkout.country")}</Label>
                      <Input
                        id="country"
                        name="country"
                        value={billingInfo.country}
                        onChange={handleBillingInfoChange}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information - Only show for physical products */}
              {!isDigitalOnly && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("checkout.shippingTitle")}</CardTitle>
                    <CardDescription>{t("checkout.shippingDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAsBilling"
                        checked={sameAsBilling}
                        onCheckedChange={(checked) => setSameAsBilling(!!checked)}
                      />
                      <Label htmlFor="sameAsBilling" className="font-normal">
                        {t("checkout.sameAsBilling")}
                      </Label>
                    </div>

                    {!sameAsBilling && (
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shippingFirstName">{t("checkout.firstName")}</Label>
                            <Input
                              id="shippingFirstName"
                              name="firstName"
                              value={shippingInfo.firstName}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingLastName">{t("checkout.lastName")}</Label>
                            <Input
                              id="shippingLastName"
                              name="lastName"
                              value={shippingInfo.lastName}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingPhone">{t("checkout.phone")}</Label>
                          <Input
                            id="shippingPhone"
                            name="phone"
                            type="tel"
                            value={shippingInfo.phone}
                            onChange={handleShippingInfoChange}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingAddress">{t("checkout.address")}</Label>
                          <Input
                            id="shippingAddress"
                            name="address"
                            value={shippingInfo.address}
                            onChange={handleShippingInfoChange}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shippingCity">{t("checkout.city")}</Label>
                            <Input
                              id="shippingCity"
                              name="city"
                              value={shippingInfo.city}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingState">{t("checkout.state")}</Label>
                            <Input
                              id="shippingState"
                              name="state"
                              value={shippingInfo.state}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shippingZipCode">{t("checkout.zipCode")}</Label>
                            <Input
                              id="shippingZipCode"
                              name="zipCode"
                              value={shippingInfo.zipCode}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingCountry">{t("checkout.country")}</Label>
                            <Input
                              id="shippingCountry"
                              name="country"
                              value={shippingInfo.country}
                              onChange={handleShippingInfoChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <Label htmlFor="notes" className="mb-2 block">
                        {t("checkout.orderNotesLabel")}
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder={t("checkout.orderNotesPlaceholder")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.deliveryMethodTitle")}</CardTitle>
                  <CardDescription>
                    {isDigitalOnly
                      ? t("checkout.digitalOrderDescription")
                      : t("checkout.deliveryMethodDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isDigitalOnly ? (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {t("checkout.shippingMethods.download.name")}
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">FREE</span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t("checkout.digitalDeliveryInfo")}
                      </p>
                      <div className="mt-4 text-sm">
                        <p className="font-medium">{t("checkout.availableFormats")}</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>{t("checkout.formats.highRes")}</li>
                          <li>{t("checkout.formats.vector")}</li>
                          <li>{t("checkout.formats.fonts")}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                      {availableShippingMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between border rounded-lg p-4 mb-2 hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <RadioGroupItem value={method.id} id={`shipping-${method.id}`} className="mr-3" />
                            <div className="flex items-center">
                              {(method as any).icon && <div className="text-gray-600 mr-2">{(method as any).icon}</div>}
                              <div>
                                <Label htmlFor={`shipping-${method.id}`} className="font-medium">
                                  {t(`checkout.shippingMethods.${method.id}.name`)}
                                </Label>
                                <p className="text-sm text-gray-500">{t(`checkout.shippingMethods.${method.id}.description`)}</p>
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {method.price === 0 ? "FREE" : `$${method.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.paymentMethodTitle")}</CardTitle>
                  <CardDescription>{t("checkout.paymentMethodDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {activePaymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center border rounded-lg p-4 mb-2 hover:bg-gray-50">
                        <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mr-3" />
                        <div className="flex items-center gap-3">
                          {method.icon && <div className="text-gray-600">{method.icon}</div>}
                          <div>
                            <Label htmlFor={`payment-${method.id}`} className="font-medium">
                              {t(`checkout.paymentMethods.${method.id}.name`)}
                            </Label>
                            <p className="text-sm text-gray-500">{t(`checkout.paymentMethods.${method.id}.description`)}</p>
                            {method.id === "wompi" && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Secure</span>
                                <span className="text-xs text-gray-500">{t("checkout.poweredByWompi")}</span>
                              </div>
                            )}
                            {method.id === "paypal" && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Secure</span>
                                <span className="text-xs text-gray-500">{t("checkout.paypalExpress")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>{t("checkout.orderSummaryTitle")}</CardTitle>
                  <CardDescription>{t("checkout.orderSummaryDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2">
                        <span>
                          {item.name} <span className="text-gray-500">x {item.quantity}</span>
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {digitalItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2">
                        <span className="flex items-center gap-2">
                          {item.name}
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{t("checkout.digitalOrderBadge")}</span>
                        </span>
                        <span>${(item.finalPrice || item.basePrice || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t("checkout.subtotalLabel")}</span>
                      <span>${combinedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("checkout.shippingLabel")}</span>
                      <span>${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("checkout.taxLabel")}</span>
                      <span>${combinedTaxAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("checkout.totalLabel")}</span>
                    <span>${combinedTotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="agreeToTerms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
                      />
                      <Label htmlFor="agreeToTerms" className="font-normal text-sm">
                        {t("checkout.agreeToTerms")}
                      </Label>
                    </div>

                    <Button
                      className="w-full bg-[#8B0000] hover:bg-[#6B0000]"
                      onClick={handleSubmitOrder}
                      disabled={internalLoading || !agreeToTerms}
                    >
                      {internalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("common.loading")}
                        </>
                      ) : (
                        `${t("checkout.completeOrder")} • $${combinedTotal.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Wompi Payment Modal */}
        {showWompiModal && currentOrder && (
          <WompiPaymentModal
            isOpen={showWompiModal}
            onClose={() => setShowWompiModal(false)}
            orderData={{
              total: combinedTotal,
              billingInfo,
              shippingInfo: sameAsBilling ? billingInfo : shippingInfo,
              items: combinedItems,
              orderId: currentOrder.id,
            }}
            onSuccess={handleWompiSuccess}
            onError={handleWompiError}
          />
        )}
      </div>
    </div>
  )
}
