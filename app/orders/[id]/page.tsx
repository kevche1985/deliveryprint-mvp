"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Package, Truck, CheckCircle, Clock, CreditCard, Printer, ArrowLeft, Edit } from "lucide-react"
import OrderItemsList from "@/components/order-items-list"
import { getOrderItemsWithImages, OrderItem } from "@/lib/database"

interface Order {
  id: string
  order_number: string
  status: string
  payment_status?: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address: any
  billing_address: any
  payment_method: string
  payment_transaction_id?: string
  created_at: string
  updated_at: string
  invoice_number?: string
  order_items: OrderItem[]
  digital_product?: {
    id: string
    download_url?: string
    preview_url?: string
    type: string
  }
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const orderId = params.id as string

  useEffect(() => {
    if (user && orderId && profile) {
      fetchOrder()
    } else if (user === null) {
      // User is not authenticated, stop loading
      setLoading(false)
    }
  }, [user, orderId, profile])

  const fetchOrder = async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Check if user is admin to determine access level
      const isAdmin = profile?.role === 'admin'
      
      // Build query - admins can view any order, users only their own
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            name,
            quantity,
            price,
            customizations,
            design_file_url,
            product_image_url,
            design_image_url,
            customized_image_url,
            print_ready_file_url,
            digital_product_id,
            digital_product:digital_products (
              id,
              download_url,
              preview_url,
              type
            )
          )
        `)
        .eq("id", orderId)
      
      // Only filter by user_id if not admin
      if (!isAdmin) {
        query = query.eq("user_id", user?.id)
      }
      
      const { data: orders, error } = await query.limit(1)

      if (error) {
        console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
        return
      }

      if (!orders || orders.length === 0) {
        console.error("Order not found or access denied")
        toast({
          title: "Error",
          description: "Order not found or you don't have permission to view it",
          variant: "destructive",
        })
        return
      }

      const fetchedOrder = orders[0]
      
      // Enhance order items with product images
      console.log('Original order items:', fetchedOrder.order_items?.length || 0)
      try {
        const orderItemsWithImages = await getOrderItemsWithImages(orderId as string)
        console.log('Enhanced order items:', orderItemsWithImages?.length || 0)
        console.log('Enhanced order items data:', orderItemsWithImages)
        
        if (orderItemsWithImages && orderItemsWithImages.length > 0) {
          fetchedOrder.order_items = orderItemsWithImages
        } else {
          console.warn('No enhanced order items found, keeping original items')
        }
      } catch (itemsError) {
        console.error('Error fetching order items with images:', itemsError)
        // Continue with existing order items if enhancement fails
      }
      
      setOrder(fetchedOrder)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAllDesigns = async () => {
    if (!order || !user) return

    setDownloadingAll(true)
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to download files.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/orders/${orderId}/download-all`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMessage = "Failed to download designs"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          const errorText = await response.text()
          console.error("Download error text:", errorText)
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `order-${order.order_number || orderId.slice(0, 8)}-designs.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "All designs downloaded successfully",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download designs",
        variant: "destructive",
      })
    } finally {
      setDownloadingAll(false)
    }
  }

  const handlePrintInvoice = async () => {
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

      const response = await fetch(`/api/orders/${orderId}/invoice`, {
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
          if (errorData.details) {
            console.error("Invoice generation details:", errorData.details)
          }
        } catch (e) {
          const errorText = await response.text()
          console.error("Invoice generation error text:", errorText)
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `Invoice_${order.invoice_number || order.order_number || orderId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Invoice generated and downloaded successfully",
      })

      // Refresh order to get updated invoice number
      fetchOrder()
    } catch (error) {
      console.error("Invoice generation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order || !user) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)

      if (error) throw error

      // Update local state
      setOrder({ ...order, status: newStatus })

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "delivered":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Show loading only when we have a user but are still fetching
  if (loading && user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
  
  // Show authentication required if no user
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            Please log in to view order details.
          </p>
          <Button onClick={() => router.push("/auth/login")}>
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.order_number || orderId.slice(0, 8).toUpperCase()}</h1>
            <p className="text-gray-600">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
            {getStatusIcon(order.status)}
            <span className="capitalize">{order.status}</span>
          </Badge>
          {order.payment_status && (
            <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
              <CreditCard className="h-3 w-3 mr-1" />
              {order.payment_status === "paid" ? "Paid" : "Pending"}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              <div className="flex space-x-2">
                {order.order_items?.some((item) => item.design_file_url || item.customized_image_url) && (
                  <Button variant="outline" size="sm" onClick={handleDownloadAllDesigns} disabled={downloadingAll}>
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingAll ? "Downloading..." : "Download All"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handlePrintInvoice} disabled={generatingInvoice}>
                  <Printer className="h-4 w-4 mr-2" />
                  {generatingInvoice ? "Generating..." : "Print Invoice"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <OrderItemsList 
                items={order.order_items || []} 
                showOperatorTools={user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'operator'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-6">
          {/* Admin/Operator Status Management */}
          {(profile?.role === 'admin' || profile?.role === 'operator') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Order Status:</label>
                  <Select
                    value={order.status}
                    onValueChange={updateOrderStatus}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <p className="text-sm text-gray-500 mt-1">Updating status...</p>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Last Updated:</strong> {new Date(order.updated_at).toLocaleString()}</p>
                  {order.payment_transaction_id && (
                    <p><strong>Transaction ID:</strong> {order.payment_transaction_id}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal?.toFixed(2) || "0.00"}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Contact</h4>
                {profile?.first_name && profile?.last_name && (
                  <p className="text-sm text-gray-600">{`${profile.first_name} ${profile.last_name}`}</p>
                )}
                {profile?.email && <p className="text-sm text-gray-600">{profile.email}</p>}
                {order.customer_phone && <p className="text-sm text-gray-600">{order.customer_phone}</p>}
              </div>

              {order.shipping_address && (
                <div>
                  <h4 className="font-medium">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                    {(order.shipping_address.city ||
                      order.shipping_address.state ||
                      order.shipping_address.zip_code) && (
                      <p>
                        {order.shipping_address.city}
                        {order.shipping_address.city && order.shipping_address.state && ", "}
                        {order.shipping_address.state} {order.shipping_address.zip_code}
                      </p>
                    )}
                    {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="capitalize">{order.payment_method || "N/A"}</span>
              </div>
              {order.payment_status && (
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                    {order.payment_status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              )}
              {order.payment_transaction_id && (
                <div className="flex justify-between">
                  <span>Transaction ID</span>
                  <span className="text-sm font-mono">{order.payment_transaction_id.slice(0, 12)}...</span>
                </div>
              )}
              {order.invoice_number && (
                <div className="flex justify-between">
                  <span>Invoice Number</span>
                  <span className="text-sm font-mono">{order.invoice_number}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
