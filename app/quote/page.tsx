"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Plus, Trash2, FileText, Send } from "lucide-react"

type QuoteItem = {
  id: string
  description: string
  quantity: number
}

type QuoteFormData = {
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceType: string
  priority: string
  additionalDetails: string
  items: QuoteItem[]
}

export default function QuotePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    priority: "normal",
    additionalDetails: "",
    items: [{ id: "1", description: "", quantity: 1 }],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof QuoteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (id: string, field: keyof QuoteItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
    }
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerName || !formData.customerEmail || !formData.serviceType) {
      toast({
        title: t("quoteRequest.toasts.missingInfo.title"),
        description: t("quoteRequest.toasts.missingInfo.description"),
        variant: "destructive",
      })
      return
    }

    if (formData.items.some((item) => !item.description.trim())) {
      toast({
        title: t("quoteRequest.toasts.incompleteItems.title"),
        description: t("quoteRequest.toasts.incompleteItems.description"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create the quote
      const quoteData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        quote_number: `QUO-${Date.now()}`,
        status: "pending",
        request_description: formData.additionalDetails,
        service_type: formData.serviceType,
        priority: formData.priority,
        customer_id: user?.id || null,
        created_by: user?.id || null,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: "USD",
      }

      console.log("Submitting quote data:", quoteData)

      const quoteResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      })

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json()
        throw new Error(errorData.error || "Failed to create quote")
      }

      const { quote } = await quoteResponse.json()
      console.log("Quote created successfully:", quote)

      // Create quote items
      const itemsData = formData.items.map((item) => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
      }))

      console.log("Submitting quote items:", itemsData)

      const itemsResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_items",
          items: itemsData,
        }),
      })

      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json()
        console.error("Quote items creation error:", errorData.error)
        // Don't fail the entire quote if items creation fails
        toast({
          title: t("quoteRequest.toasts.partialSuccess.title"),
          description: t("quoteRequest.toasts.partialSuccess.description"),
          variant: "default",
        })
      } else {
        console.log("Quote items created successfully")
      }

      toast({
        title: t("quoteRequest.toasts.success.title"),
        description: t("quoteRequest.toasts.success.description").replace("#{number}", quote.quote_number),
      })

      // Reset form
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        serviceType: "",
        priority: "normal",
        additionalDetails: "",
        items: [{ id: "1", description: "", quantity: 1 }],
      })

      // Redirect to success page or dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Quote creation error:", error)
      toast({
        title: t("quoteRequest.toasts.failed.title"),
        description: error instanceof Error ? error.message : t("quoteRequest.toasts.failed.description"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("quoteRequest.title")}</h1>
          <p className="text-gray-600">
            {t("quoteRequest.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t("orders.customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">{t("quoteRequest.fullName")} *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder={t("quoteRequest.placeholders.fullName")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">{t("quoteRequest.emailAddress")} *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder={t("quoteRequest.placeholders.email")}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerPhone">{t("quoteRequest.phoneNumber")}</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  placeholder={t("quoteRequest.placeholders.phone")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quoteRequest.labels.serviceDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">{t("quoteRequest.labels.serviceType")} *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("quoteRequest.placeholders.serviceType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital-printing">{t("services.digitalPrinting")}</SelectItem>
                      <SelectItem value="large-format">{t("services.largeFormat")}</SelectItem>
                      <SelectItem value="event-stands">{t("services.eventStands")}</SelectItem>
                      <SelectItem value="illuminated-signs">{t("services.illuminatedSigns")}</SelectItem>
                      <SelectItem value="custom-design">{t("services.designServices")}</SelectItem>
                      <SelectItem value="other">{t("services.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">{t("quoteRequest.labels.priority")}</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("quoteRequest.placeholders.priority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("quoteRequest.priorities.low")}</SelectItem>
                      <SelectItem value="normal">{t("quoteRequest.priorities.normal")}</SelectItem>
                      <SelectItem value="high">{t("quoteRequest.priorities.high")}</SelectItem>
                      <SelectItem value="urgent">{t("quoteRequest.priorities.urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("quoteRequest.labels.quoteItems")}
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("quoteRequest.labels.addItem")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`item-description-${item.id}`}>{t("quoteRequest.labels.description")} {index + 1} *</Label>
                    <Textarea
                      id={`item-description-${item.id}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      placeholder={t("quoteRequest.placeholders.itemDescription")}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`item-quantity-${item.id}`}>{t("quoteRequest.labels.quantity")}</Label>
                    <Input
                      id={`item-quantity-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quoteRequest.labels.additionalDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="additionalDetails">{t("quoteRequest.labels.additionalDetails")}</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                placeholder={t("quoteRequest.placeholders.additionalDetails")}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="px-8 py-3 text-lg">
              {isSubmitting ? (
                t("quoteRequest.submitting")
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  {t("quoteRequest.submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
