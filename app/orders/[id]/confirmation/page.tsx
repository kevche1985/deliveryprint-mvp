"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Printer, FileText, ArrowRight, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { getOrderById, getOrderItems } from "@/lib/database"
import type { Order, OrderItem } from "@/lib/database"
import { track } from "@/lib/analytics"
import DisputeModal from "@/components/dispute-modal"
import { useLanguage } from "@/lib/language-context"

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get("status") || "pending"
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [printingReceipt, setPrintingReceipt] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [disputes, setDisputes] = useState<any[]>([])
  const [showDisputeDetail, setShowDisputeDetail] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null)
  const [disputeComments, setDisputeComments] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")

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

  useEffect(() => {
    const loadDisputes = async () => {
      if (!user || !id) return
      const { data } = await supabase.from("disputes").select("*").eq("order_id", id as string).eq("user_id", user.id).order("created_at", { ascending: false })
      setDisputes(data || [])
    }
    loadDisputes()
  }, [id, user])

  const openDisputeDetail = async (d: any) => {
    setSelectedDispute(d)
    const { data } = await supabase.from("dispute_comments").select("*").eq("dispute_id", d.id).order("created_at", { ascending: true })
    setDisputeComments(data || [])
    setShowDisputeDetail(true)
  }

  const sendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const resp = await fetch(`/api/disputes/${selectedDispute.id}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: newMessage }) })
    const payload = await resp.json()
    if (resp.ok) {
      setDisputeComments([...disputeComments, payload.comment])
      setNewMessage("")
    }
  }

  const uploadFile = async (file: File) => {
    if (!selectedDispute || !file) return
    setUploading(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const form = new FormData()
    form.append('file', file)
    const resp = await fetch(`/api/disputes/${selectedDispute.id}/files/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
    setUploading(false)
    if (resp.ok) setSelectedFileName("")
  }

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
              <title>${t("orders.receipt.title")} - ${order.order_number}</title>
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
                <div>${t("orders.receipt.companyTagline")}</div>
                <div>123 Business Avenue, San Salvador, El Salvador</div>
                <div>Phone: +503 2222-3333 | Email: info@deliveryprint.com</div>
                <div class="receipt-title">${t("orders.receipt.title")}</div>
              </div>
              
              <div class="order-info">
                <p><strong>${t("orders.orderNumber")}</strong> ${order.order_number}</p>
                <p><strong>${t("orders.receipt.date")}</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>${t("orders.receipt.paymentMethod")}</strong> ${t(`checkout.paymentMethods.${order.payment_method}.name`) || order.payment_method}</p>
                <p><strong>${t("orders.receipt.status")}</strong> ${(order as any).payment_status || t("orders.paymentStatuses.paid")}</p>
              </div>
              
              <div class="items">
                <table>
                  <thead>
                    <tr>
                      <th>${t("orders.receipt.item")}</th>
                      <th>${t("orders.receipt.qty")}</th>
                      <th>${t("orders.receipt.price")}</th>
                      <th>${t("orders.receipt.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItems.map(item => `
                      <tr>
                        <td>${item.name || t("orders.unknownItem")}</td>
                        <td>${item.quantity || 1}</td>
                        <td>$${(item.price || 0).toFixed(2)}</td>
                        <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="total">
                <p>${t("orders.receipt.subtotal")} $${order.subtotal.toFixed(2)}</p>
                <p>${t("orders.receipt.shipping")} $${order.shipping.toFixed(2)}</p>
                <p>${t("orders.receipt.tax")} $${order.tax.toFixed(2)}</p>
                <p style="font-size: 18px; color: #8B0000;">${t("orders.receipt.grandTotal")} $${order.total.toFixed(2)}</p>
              </div>
              
              <div class="footer">
                <p>${t("orders.receipt.thankYou")}</p>
                <p>${t("orders.receipt.contactSupport")}</p>
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
        title: t("common.error"),
        description: t("orders.errors.printFailed") || "Failed to print receipt. Please try again.",
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
          title: t("orders.errors.authError"),
          description: t("orders.errors.loginToDownload"),
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
        let errorMessage = t("orders.errors.invoiceGen")
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
        title: t("common.success"),
        description: t("orders.success.invoice"),
      })
    } catch (error) {
      console.error("Invoice download error:", error)
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("orders.errors.invoiceGen"),
        variant: "destructive",
      })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("orders.authRequiredTitle")}</h1>
          <p className="mb-6">{t("orders.authRequiredDesc")}</p>
          <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
            <Link href="/auth/login">{t("orders.login")}</Link>
          </Button>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold mb-4">{t("orders.notFoundTitle")}</h1>
          <p className="mb-6">{t("orders.notFoundDesc")}</p>
          <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
            <Link href="/orders">{t("orders.viewYourOrders")}</Link>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("orders.confirmedTitle")}</h1>
              <p className="text-xl text-gray-600">
                {t("orders.thankYouOrder")} <span className="font-semibold">{order.order_number}</span>
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-[#8B0000] mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("orders.receivedTitle")}</h1>
              <p className="text-xl text-gray-600">
                {t("orders.receivedOrder")} <span className="font-semibold">{order.order_number}</span>
              </p>
            </>
          )}
        </motion.div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{t("orders.details")}</CardTitle>
                  <CardDescription>{t("orders.placedOn")} {new Date(order.created_at).toLocaleDateString()}</CardDescription>
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
                  {t(`orders.statuses.${order.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">{t("orders.shippingAddress")}</h3>
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
                    <h3 className="font-semibold mb-2">{t("orders.paymentInfo")}</h3>
                    <p className="text-gray-600">
                      <span className="font-medium">{t("orders.method")}:</span>{" "}
                      {t(`checkout.paymentMethods.${order.payment_method}.name`) || order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">{t("orders.status")}:</span> {paymentStatus === "success" ? t("orders.paymentStatuses.paid") : t("orders.paymentStatuses.pending")}
                    </p>
                    {((order as any).shipping_method || 'standard') === 'download' && (
                      <p className="text-green-700 text-sm">{t("orders.digitalDownloadReady")}</p>
                    )}
                    <p className="text-gray-600">
                      <span className="font-medium">{t("orders.shipping")}:</span>{" "}
                      {t(`checkout.shippingMethods.${(order as any).shipping_method || 'standard'}.name`) || ((order as any).shipping_method || 'standard').charAt(0).toUpperCase() + ((order as any).shipping_method || 'standard').slice(1)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">{t("orders.items")}</h3>
                  <div className="space-y-4">
                    {orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4 flex-shrink-0">
                              <img
                                src={
                                  (item as any).product_image_url ||
                                  (item as any).design_image_url ||
                                  (item as any).customized_image_url ||
                                  "/placeholder.svg?height=64&width=64&query=product"
                                }
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-500">{t("orders.quantity")}: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">{t("orders.noItems")}</p>
                    )}
                  </div>
                </div>

                {disputes.length > 0 && (
                  <div>
                    <Separator />
                    <h3 className="font-semibold mb-4">{t("disputes.title")}</h3>
                    <div className="space-y-3">
                      {disputes.map((d) => (
                        <div key={d.id} className="flex items-center justify-between border rounded p-3">
                          <div>
                            <p className="font-medium">{d.reason}</p>
                            <p className="text-sm text-gray-600">{t("disputes.status")} {d.status}</p>
                            {d.resolution && <p className="text-sm text-gray-600">{t("disputes.resolution")} {d.resolution}</p>}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => openDisputeDetail(d)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <div className="space-y-1">
                    <p className="text-gray-600">{t("orders.subtotal")}</p>
                    <p className="text-gray-600">{t("orders.shipping")}</p>
                    <p className="text-gray-600">{t("orders.tax")}</p>
                    <p className="font-semibold">{t("orders.total")}</p>
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
              {printingReceipt ? t("orders.printing") : t("orders.printReceipt")}
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
              {generatingInvoice ? t("orders.generating") : t("orders.downloadInvoice")}
            </Button>
            <Button asChild className="flex-1 bg-[#8B0000] hover:bg-[#6B0000]">
              <Link href="/orders">
                {t("orders.viewAllOrders")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {(paymentStatus === "success" || (order?.payment_status === "paid") || (order?.status === "confirmed") || (order?.status === "completed")) && (
              <Button className="flex-1" variant="outline" onClick={() => setShowDispute(true)}>
                {t("orders.requestRefund")}
              </Button>
            )}
          </div>
          <DisputeModal open={showDispute} onOpenChange={setShowDispute} orderId={order?.id || String(id)} paymentProvider={order?.payment_method} captureId={(order as any)?.paypal_capture_id} onCreated={() => toast({ title: t("success"), description: t("disputes.detailsTitle") })} />
          <Dialog open={showDisputeDetail} onOpenChange={setShowDisputeDetail}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("disputes.detailsTitle")}</DialogTitle>
              </DialogHeader>
              {selectedDispute && (
                <div className="space-y-3">
                  <p className="text-sm"><span className="font-medium">{t("disputes.reason")}</span> {selectedDispute.reason}</p>
                  <p className="text-sm"><span className="font-medium">{t("disputes.status")}</span> {selectedDispute.status}</p>
                  {selectedDispute.description && <p className="text-sm"><span className="font-medium">{t("disputes.description")}</span> {selectedDispute.description}</p>}
                  {selectedDispute.resolution && <p className="text-sm"><span className="font-medium">{t("disputes.resolution")}</span> {selectedDispute.resolution}</p>}
                  <div>
                    <p className="font-semibold mb-2">{t("disputes.messages")}</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {disputeComments.length === 0 ? (
                        <p className="text-sm text-gray-500">{t("disputes.noMessages")}</p>
                      ) : (
                        disputeComments.map((c) => (
                          <div key={c.id} className="border rounded p-2 text-sm">
                            <p>{c.comment}</p>
                            <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <textarea className="w-full border rounded p-2 text-sm" placeholder={t("disputes.writeMessage")} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                      <div className="flex gap-2 justify-center items-center">
                        <Button variant="outline" onClick={sendMessage}>{t("disputes.send")}</Button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) { setSelectedFileName(e.target.files[0].name); uploadFile(e.target.files[0]) } }} />
                        <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => fileInputRef.current?.click()}>
                          {t("disputes.chooseFile")}
                        </Button>
                        {selectedFileName && <span className="text-xs">{selectedFileName}</span>}
                        {uploading && <span className="text-xs text-gray-500">{t("disputes.uploading")}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
