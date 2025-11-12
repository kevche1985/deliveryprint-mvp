"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Eye, Edit, Package, Truck, CheckCircle, XCircle, Download, FileText, Printer, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  customizations?: any
  design_file_url?: string
  product_image_url?: string
  design_image_url?: string
  customized_image_url?: string
  print_ready_file_url?: string
  product_id?: string
  digital_product_id?: string
  digital_product?: {
    id: string
    download_url?: string
    preview_url?: string
    type: string
  }
}

type Order = {
  id: string
  order_number: string
  user_id: string
  email: string
  status: string
  payment_status?: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  shipping_method: string
  payment_method: string
  created_at: string
  updated_at: string
  shipping_address: any
  billing_address: any
  notes: string
  currency: string
  has_design_files: boolean
  production_notes: string | null
  operator_downloads: string
  payment_transaction_id: string | null
  invoice_number: string | null
  order_items?: OrderItem[]
}

export default function OrderManagement() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [downloadingDesign, setDownloadingDesign] = useState<string | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
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
            product_id,
            digital_product_id,
            digital_product:digital_products (
              id,
              download_url,
              preview_url,
              type
            )
          )
        `)
        .order("created_at", { ascending: false })
  
      if (error) throw error
      
      // Parse JSON fields and convert string numbers to actual numbers
      const processedOrders = (data || []).map(order => ({
        ...order,
        // Convert string numbers to actual numbers
        subtotal: parseFloat(order.subtotal) || 0,
        tax: parseFloat(order.tax) || 0,
        shipping: parseFloat(order.shipping) || 0,
        discount: parseFloat(order.discount) || 0,
        total: parseFloat(order.total) || 0,
        // Parse JSON address fields
        shipping_address: typeof order.shipping_address === 'string' 
          ? JSON.parse(order.shipping_address) 
          : order.shipping_address,
        billing_address: typeof order.billing_address === 'string' 
          ? JSON.parse(order.billing_address) 
          : order.billing_address,
      }))
      
      setOrders(processedOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: t("common.error"),
        description: t("admin.orders.toasts.errorLoadingOrders"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
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
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

      toast({
        title: t("common.success"),
        description: `${t("admin.orders.toasts.statusUpdatedPrefix")} ${t("admin.orders.statuses." + newStatus)}`,
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: t("common.error"),
        description: t("admin.orders.toasts.updateStatusError"),
        variant: "destructive",
      })
    }
  }

  const downloadDesignFile = async (item: OrderItem) => {
    // Priority: digital_product.download_url > print_ready_file_url > design_file_url > customized_image_url
    const downloadUrl = item.digital_product?.download_url || 
                       item.print_ready_file_url || 
                       item.design_file_url || 
                       item.customized_image_url
    
    if (!downloadUrl) {
      toast({
        title: t("admin.orders.toasts.noDesignFileTitle"),
        description: t("admin.orders.toasts.noDesignFileDesc"),
        variant: "destructive",
      })
      return
    }

    setDownloadingDesign(item.id)
    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${item.name}-design.${downloadUrl.split('.').pop()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("admin.orders.toasts.downloadStartedTitle"),
        description: `${t("admin.orders.toasts.downloadStartedDescPrefix")} ${item.name}`,
      })
    } catch (error) {
      console.error("Error downloading design file:", error)
      toast({
        title: t("admin.orders.toasts.downloadFailedTitle"),
        description: t("admin.orders.toasts.downloadFailedDesc"),
        variant: "destructive",
      })
    } finally {
      setDownloadingDesign(null)
    }
  }

  const generateInvoice = async (order: Order) => {
    setGeneratingInvoice(true)
    try {
      // Generate invoice number if not exists
      let invoiceNumber = order.invoice_number
      if (!invoiceNumber) {
        invoiceNumber = `INV-${order.order_number}-${Date.now()}`
        
        const { error } = await supabase
          .from("orders")
          .update({ invoice_number: invoiceNumber })
          .eq("id", order.id)

        if (error) throw error
      }

      // Open invoice in new window for printing
      const invoiceWindow = window.open('', '_blank')
      if (invoiceWindow) {
        invoiceWindow.document.write(generateInvoiceHTML(order, invoiceNumber))
        invoiceWindow.document.close()
        invoiceWindow.print()
      }

      toast({
        title: t("admin.orders.toasts.invoiceGeneratedTitle"),
        description: `${t("admin.orders.toasts.invoiceGeneratedDescPrefix")} ${invoiceNumber} ${t("admin.orders.toasts.invoiceGeneratedDescSuffix")}`,
      })
    } catch (error) {
      console.error("Error generating invoice:", error)
      toast({
        title: t("common.error"),
        description: t("admin.orders.toasts.invoiceGenerateError"),
        variant: "destructive",
      })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  const generateInvoiceHTML = (order: Order, invoiceNumber: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("admin.orders.invoicePage.titlePrefix")} ${invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; }
          .total-row { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t("admin.orders.invoice")}</h1>
          <h2>DeliveryPrint</h2>
        </div>
        
        <div class="invoice-details">
          <p><strong>${t("admin.orders.invoicePage.invoiceNumberLabel")}</strong> ${invoiceNumber}</p>
          <p><strong>${t("admin.orders.invoicePage.orderNumberLabel")}</strong> ${order.order_number}</p>
          <p><strong>${t("admin.orders.invoicePage.dateLabel")}</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>${t("admin.orders.invoicePage.paymentMethodLabel")}</strong> ${t(`checkout.paymentMethods.${order.payment_method}.name`)}</p>
          <p><strong>${t("admin.orders.invoicePage.transactionIdLabel")}</strong> ${order.payment_transaction_id || t("admin.orders.na")}</p>
        </div>
        
        <div class="customer-info">
          <h3>${t("admin.orders.invoicePage.billTo")}</h3>
          <p>${order.shipping_address?.firstName} ${order.shipping_address?.lastName}</p>
          <p>${order.email}</p>
          <p>${order.shipping_address?.address}</p>
          <p>${order.shipping_address?.city}, ${order.shipping_address?.state} ${order.shipping_address?.zipCode}</p>
          <p>${order.shipping_address?.country}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>${t("admin.orders.invoicePage.tableHeaders.item")}</th>
              <th>${t("admin.orders.invoicePage.tableHeaders.quantity")}</th>
              <th>${t("admin.orders.invoicePage.tableHeaders.unitPrice")}</th>
              <th>${t("admin.orders.invoicePage.tableHeaders.total")}</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items?.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <div class="totals">
          <p>${t("admin.orders.subtotalLabel")}: $${order.subtotal.toFixed(2)}</p>
          <p>${t("admin.orders.shippingLabel")}: $${order.shipping.toFixed(2)}</p>
          <p>${t("admin.orders.taxLabel")}: $${order.tax.toFixed(2)}</p>
          <p class="total-row">${t("admin.orders.totalLabel")}: $${order.total.toFixed(2)}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
          <p>${t("admin.orders.invoicePage.thankYouNote")}</p>
        </div>
      </body>
      </html>
    `
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "processing":
        return "bg-blue-600"
      case "shipped":
        return "bg-purple-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-[#8B0000]"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle
      case "processing":
        return Package
      case "shipped":
        return Truck
      case "cancelled":
        return XCircle
      default:
        return Package
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  }

  return (
    <div className="space-y-6">
     <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.orders.headerTitle")}</h1>
        <p className="text-gray-600">{t("admin.orders.subtitle")}</p>
      </div> 

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: t("admin.orders.stats.total"), value: orderStats.total, color: "bg-gray-600" },
          { label: t("admin.orders.stats.pending"), value: orderStats.pending, color: "bg-[#8B0000]" },
          { label: t("admin.orders.stats.processing"), value: orderStats.processing, color: "bg-blue-600" },
          { label: t("admin.orders.stats.shipped"), value: orderStats.shipped, color: "bg-purple-600" },
          { label: t("admin.orders.stats.completed"), value: orderStats.completed, color: "bg-green-600" },
          { label: t("admin.orders.stats.cancelled"), value: orderStats.cancelled, color: "bg-red-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`w-8 h-8 ${stat.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("admin.orders.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("admin.orders.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.orders.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("admin.orders.statuses.pending")}</SelectItem>
                <SelectItem value="processing">{t("admin.orders.statuses.processing")}</SelectItem>
                <SelectItem value="shipped">{t("admin.orders.statuses.shipped")}</SelectItem>
                <SelectItem value="completed">{t("admin.orders.statuses.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("admin.orders.statuses.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.orders.title")} ({filteredOrders.length})</CardTitle>
          <CardDescription>{t("admin.orders.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.orders.table.order")}</TableHead>
                <TableHead>{t("admin.orders.table.customer")}</TableHead>
                <TableHead>{t("admin.orders.table.status")}</TableHead>
                <TableHead>{t("admin.orders.table.total")}</TableHead>
                <TableHead>{t("admin.orders.table.payment")}</TableHead>
                <TableHead>{t("admin.orders.table.date")}</TableHead>
                <TableHead className="text-right">{t("admin.orders.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">{t("admin.orders.loading")}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {t(`checkout.shippingMethods.${order.shipping_method}.name`)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.email}</p>
                          <p className="text-sm text-gray-500">
                            {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={getStatusColor(order.status)}>
                            {t(`admin.orders.statuses.${order.status}`)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`checkout.paymentMethods.${order.payment_method}.name`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{t("admin.orders.orderDetailsTitle").replace("{orderNumber}", order.order_number)}</DialogTitle>
                                <DialogDescription>{t("admin.orders.orderDetailsDescription")}</DialogDescription>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                                  {/* Order Header with Actions */}
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <Badge className={getStatusColor(selectedOrder.status)}>
                                        {t(`admin.orders.statuses.${selectedOrder.status}`)}
                                      </Badge>
                                      {selectedOrder.payment_status && (
                                        <Badge variant="outline" className="ml-2">
                                          {t("admin.orders.paymentLabel")}: {selectedOrder.payment_status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => generateInvoice(selectedOrder)}
                                        disabled={generatingInvoice}
                                      >
                                        {generatingInvoice ? (
                                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("admin.orders.generating")}</>
                                        ) : (
                                          <><FileText className="h-4 w-4 mr-2" />{t("admin.orders.invoice")}</>
                                        )}
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Customer & Order Info */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold mb-3">{t("admin.orders.customerInformation")}</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>{t("admin.orders.emailLabel")} </strong> {selectedOrder.email}</p>
                                        <p><strong>{t("admin.orders.nameLabel")} </strong> {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}</p>
                                        <p><strong>{t("admin.orders.phoneLabel")} </strong> {selectedOrder.shipping_address?.phone}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-3">{t("admin.orders.paymentDelivery")}</h4>
                                      <div className="space-y-2 text-sm">
                                        <p><strong>{t("admin.orders.paymentLabel")} </strong> {t(`checkout.paymentMethods.${selectedOrder.payment_method}.name`)}</p>
                                        <p><strong>{t("admin.orders.shippingLabel")} </strong> {t(`checkout.shippingMethods.${selectedOrder.shipping_method}.name`)}</p>
                                        <p><strong>{t("admin.orders.transactionLabel")} </strong> {selectedOrder.payment_transaction_id || t("admin.orders.na")}</p>
                                        {selectedOrder.invoice_number && (
                                          <p><strong>{t("admin.orders.invoiceLabel")} </strong> {selectedOrder.invoice_number}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Shipping Address */}
                                  <div>
                                    <h4 className="font-semibold mb-3">{t("admin.orders.shippingAddress")}</h4>
                                    <address className="text-sm not-italic bg-gray-50 p-3 rounded">
                                      {selectedOrder.shipping_address?.address}<br />
                                      {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zipCode}<br />
                                      {selectedOrder.shipping_address?.country}
                                    </address>
                                  </div>

                                  {/* Order Items */}
                                  <div>
                                    <h4 className="font-semibold mb-3">{t("admin.orders.orderItems")} ({selectedOrder.order_items?.length || 0})</h4>
                                    <div className="space-y-3">
                                      {selectedOrder.order_items?.map((item) => (
                                        <div key={item.id} className="border rounded-lg p-4">
                                          <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                              {(() => {
                                                // Priority: digital_product.download_url > digital_product.preview_url > customized_image_url > design_image_url > product_image_url
                                                const imageUrl = item.digital_product?.download_url || 
                                                               item.digital_product?.preview_url || 
                                                               item.customized_image_url || 
                                                               item.design_image_url || 
                                                               item.product_image_url
                                                
                                                return imageUrl ? (
                                                  <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded border"
                                                  />
                                                ) : (
                                                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-gray-400" />
                                                  </div>
                                                )
                                              })()}
                                              <div>
                                                <h5 className="font-medium">{item.name}</h5>
                                                <p className="text-sm text-gray-600">{t("admin.orders.qtyLabel")} {item.quantity} × ${item.price.toFixed(2)}</p>
                                                <p className="text-sm font-medium">{t("admin.orders.itemTotalLabel")} ${(item.quantity * item.price).toFixed(2)}</p>
                                                {item.digital_product && (
                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                                    {t("admin.orders.digitalBadgePrefix")} {item.digital_product.type}
                                                  </span>
                                                )}
                                                {item.customizations && (
                                                  <p className="text-xs text-gray-500 mt-1">{t("admin.orders.customizedLabel")}</p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              {(() => {
                                                // Priority for download: digital_product.download_url > print_ready_file_url > design_file_url > customized_image_url
                                                const downloadUrl = item.digital_product?.download_url || 
                                                                  item.print_ready_file_url || 
                                                                  item.design_file_url || 
                                                                  item.customized_image_url
                                                
                                                if (downloadUrl) {
                                                  return (
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => downloadDesignFile(item)}
                                                      disabled={downloadingDesign === item.id}
                                                    >
                                                      {downloadingDesign === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                      ) : (
                                                        <Download className="h-4 w-4" />
                                                      )}
                                                    </Button>
                                                  )
                                                }
                                                return null
                                              })()}
                                            </div>
                                          </div>
                                          {item.customizations && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                              <strong>{t("admin.orders.customizationsLabel")}</strong>
                                              <pre className="mt-1 whitespace-pre-wrap">
                                                {JSON.stringify(item.customizations, null, 2)}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      )) || (
                                        <p className="text-gray-500 text-center py-4">{t("admin.orders.noItemsFound")}</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Order Summary */}
                                  <div>
                                    <h4 className="font-semibold mb-3">{t("admin.orders.orderSummary")}</h4>
                                    <div className="bg-gray-50 p-4 rounded space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>{t("admin.orders.subtotalLabel")}</span>
                                        <span>${selectedOrder.subtotal.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{t("admin.orders.shippingLabel")}</span>
                                        <span>${selectedOrder.shipping.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>{t("admin.orders.taxLabel")}</span>
                                        <span>${selectedOrder.tax.toFixed(2)}</span>
                                      </div>
                                      {selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                          <span>{t("admin.orders.discountLabel")}</span>
                                          <span>-${selectedOrder.discount.toFixed(2)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                        <span>{t("admin.orders.totalLabel")}</span>
                                        <span>${selectedOrder.total.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status Management */}
                                  <div>
                                    <h4 className="font-semibold mb-3">{t("admin.orders.orderManagement")}</h4>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">{t("admin.orders.updateStatus")}</label>
                                        <Select
                                          value={selectedOrder.status}
                                          onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">{t("admin.orders.statuses.pending")}</SelectItem>
                                            <SelectItem value="confirmed">{t("admin.orders.statuses.confirmed")}</SelectItem>
                                            <SelectItem value="processing">{t("admin.orders.statuses.processing")}</SelectItem>
                                            <SelectItem value="printing">{t("admin.orders.statuses.printing")}</SelectItem>
                                            <SelectItem value="shipped">{t("admin.orders.statuses.shipped")}</SelectItem>
                                            <SelectItem value="completed">{t("admin.orders.statuses.completed")}</SelectItem>
                                            <SelectItem value="cancelled">{t("admin.orders.statuses.cancelled")}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      {selectedOrder.notes && (
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">{t("admin.orders.customerNotesLabel")}</label>
                                          <p className="text-sm bg-yellow-50 p-2 rounded">{selectedOrder.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/orders/${order.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("admin.orders.noOrdersFound")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}