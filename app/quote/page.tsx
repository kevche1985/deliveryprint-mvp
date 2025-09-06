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
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (formData.items.some((item) => !item.description.trim())) {
      toast({
        title: "Incomplete Items",
        description: "Please provide descriptions for all items.",
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
          title: "Quote Created",
          description: "Quote was created but some items may not have been saved properly.",
          variant: "default",
        })
      } else {
        console.log("Quote items created successfully")
      }

      toast({
        title: "Quote Submitted Successfully",
        description: `Your quote request #${quote.quote_number} has been submitted. We'll get back to you soon!`,
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
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit quote. Please try again.",
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
          <h1 className="text-4xl font-bold mb-4">Request a Quote</h1>
          <p className="text-gray-600">
            Get a custom quote for your printing needs. Fill out the form below and we'll get back to you within 24
            hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital-printing">Digital Printing</SelectItem>
                      <SelectItem value="large-format">Large Format Printing</SelectItem>
                      <SelectItem value="event-stands">Event Stands</SelectItem>
                      <SelectItem value="illuminated-signs">Illuminated Signs</SelectItem>
                      <SelectItem value="custom-design">Custom Design Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Standard delivery</SelectItem>
                      <SelectItem value="normal">Normal - Within 5-7 days</SelectItem>
                      <SelectItem value="high">High - Within 2-3 days</SelectItem>
                      <SelectItem value="urgent">Urgent - Within 24 hours</SelectItem>
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
                Quote Items
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`item-description-${item.id}`}>Item Description {index + 1} *</Label>
                    <Textarea
                      id={`item-description-${item.id}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      placeholder="Describe the item you need printed (size, material, quantity, etc.)"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`item-quantity-${item.id}`}>Quantity</Label>
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
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="additionalDetails">Additional Information</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                placeholder="Any additional details, special requirements, or questions you have..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="px-8 py-3 text-lg">
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Quote Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
