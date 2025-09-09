"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Printer, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { getOrderById, getOrderItems } from "@/lib/database"
import type { Order, OrderItem } from "@/lib/database"

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get("status") || "pending"
  const { user } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [printingReceipt, setPrintingReceipt] = useState(false)

  useEffect(() => {
    async function loadOrderData() {
      if (!user) return

      setLoading(true)
      try {
        const orderData = await getOrderById(id as string)
        setOrder(orderData)

        const orderItemsData = await getOrderItems(id as string)
        setOrderItems(orderItemsData)
      } catch (error) {
        console.error("Error loading order data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      loadOrderData()
    }
  }, [id, user])

  const handlePrintReceipt = () => {
    if (!order) return
    
    setPrintingReceipt(true)
    try {
      // Create a printable receipt
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${order.order_number}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; color: #8B0000; }
                .receipt-title { font-size: 18px; margin: 10px 0; }
                .order-info { margin: 20px 0; }
                .items { margin: 20px 0; }
                .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f5f5f5; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="company-name">DELIVERY PRINT</div>
                <div>Professional Printing & Design Services</div>
                <div>123 Business Avenue, San Salvador, El Salvador</div>
                <div>Phone: +503 2222-3333 | Email: info@deliveryprint.com</div>
                <div class="receipt-title">RECEIPT</div>
              </div>
              
              <div class="order-info">
                <p><strong>Order #:</strong> ${order.order_number}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method?.toUpperCase() || 'N/A'}</p>
                <p><strong>Status:</strong> ${(order as any).payment_status || 'Paid'}</p>
              </div>
              
              <div class="items">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItems.map(item => `
                      <tr>
                        <td>${item.name || 'Unknown Item'}</td>
                        <td>${item.quantity || 1}</td>
                        <td>$${(item.price || 0).toFixed(2)}</td>
                        <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="total">
                <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
                <p>Shipping: $${order.shipping.toFixed(2)}</p>
                <p>Tax: $${order.tax.toFixed(2)}</p>
                <p style="font-size: 18px; color: #8B0000;">TOTAL: $${order.total.toFixed(2)}</p>
              </div>
              
              <div class="footer">
                <p>Thank you for choosing Delivery Print!</p>
                <p>For questions, contact us at support@deliveryprint.com</p>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Print Error",
        description: "Failed to print receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPrintingReceipt(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!order || !user) return

    setGeneratingInvoice(true)
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to generate invoice.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/orders/${id}/invoice`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to generate invoice"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error("Invoice generation error:", e)
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `Invoice_${order.order_number || id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Invoice Downloaded",
        description: "Your invoice has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Invoice download error:", error)
      toast({
        title: "Download Error",
        description: error instanceof Error ? error.message : "Failed to download invoice.",
        variant: "destructive",
      })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="mb-6">We couldn't find the order you're looking for.</p>
          <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
            <Link href="/orders">View Your Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {paymentStatus === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-xl text-gray-600">
                Thank you for your order. Your order number is{" "}
                <span className="font-semibold">{order.order_number}</span>
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-[#8B0000] mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Received</h1>
              <p className="text-xl text-gray-600">
                Your order has been received and is pending payment. Order number:{" "}
                <span className="font-semibold">{order.order_number}</span>
              </p>
            </>
          )}
        </motion.div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                </div>
                <Badge
                  className={
                    order.status === "completed"
                      ? "bg-green-600"
                      : order.status === "processing"
                        ? "bg-blue-600"
                        : order.status === "cancelled"
                          ? "bg-red-600"
                          : "bg-[#8B0000]"
                  }
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <address className="not-italic text-gray-600">
                      {order.shipping_address.firstName} {order.shipping_address.lastName}
                      <br />
                      {order.shipping_address.address}
                      <br />
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                      <br />
                      {order.shipping_address.country}
                      <br />
                      {order.shipping_address.phone}
                    </address>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Payment Information</h3>
                    <p className="text-gray-600">
                      <span className="font-medium">Method:</span>{" "}
                      {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> {paymentStatus === "success" ? "Paid" : "Pending"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Shipping:</span>{" "}
                      {((order as any).shipping_method || 'standard').charAt(0).toUpperCase() + ((order as any).shipping_method || 'standard').slice(1)} Shipping
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4 flex-shrink-0">
                              {/* Use a placeholder for now */}
                              <img
                                src="/placeholder.svg?height=64&width=64&query=product"
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No items available</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <div className="space-y-1">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="text-gray-600">Shipping</p>
                    <p className="text-gray-600">Tax</p>
                    <p className="font-semibold">Total</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-gray-600">${order.subtotal.toFixed(2)}</p>
                    <p className="text-gray-600">${order.shipping.toFixed(2)}</p>
                    <p className="text-gray-600">${order.tax.toFixed(2)}</p>
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handlePrintReceipt}
              disabled={printingReceipt}
            >
              {printingReceipt ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {printingReceipt ? 'Printing...' : 'Print Receipt'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDownloadInvoice}
              disabled={generatingInvoice}
            >
              {generatingInvoice ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {generatingInvoice ? 'Generating...' : 'Download Invoice'}
            </Button>
            <Button asChild className="flex-1 bg-[#8B0000] hover:bg-[#6B0000]">
              <Link href="/orders">
                View All Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
