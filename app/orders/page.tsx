"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, FileText, Eye } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getUserOrders } from "@/lib/database"
import type { Order } from "@/lib/database"

export default function OrdersPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function loadOrders() {
      if (!user) return

      setLoading(true)
      try {
        const orderData = await getUserOrders(user.id)
        setOrders(orderData)
        setFilteredOrders(orderData)
      } catch (error) {
        console.error("Error loading orders:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadOrders()
    }
  }, [user])

  useEffect(() => {
    if (orders.length === 0) return

    let filtered = [...orders]

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((order) => order.status === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status dropdown
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      if (dateFilter === "last7days") {
        filterDate.setDate(now.getDate() - 7)
      } else if (dateFilter === "last30days") {
        filterDate.setDate(now.getDate() - 30)
      } else if (dateFilter === "last3months") {
        filterDate.setMonth(now.getMonth() - 3)
      } else if (dateFilter === "last6months") {
        filterDate.setMonth(now.getMonth() - 6)
      }

      filtered = filtered.filter((order) => new Date(order.created_at) >= filterDate)
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, statusFilter, dateFilter, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "processing":
        return "bg-blue-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-[#8B0000]"
    }
  }

  const getOrdersByStatus = (status: string) => {
    if (status === "all") return orders
    return orders.filter((order) => order.status === status)
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

  const renderOrdersList = (ordersToShow: Order[]) => {
    if (ordersToShow.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("orders.noOrdersTitle")}</h2>
          <p className="text-gray-500 mb-6">
            {orders.length === 0 ? t("orders.noOrdersDesc") : t("orders.noOrdersFilterDesc")}
          </p>
          {orders.length === 0 ? (
            <Button asChild className="bg-[#8B0000] hover:bg-[#6B0000]">
              <Link href="/products">{t("orders.browseProducts")}</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setDateFilter("all")
                setActiveTab("all")
              }}
            >
              {t("orders.clearFilters")}
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {ordersToShow.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <p className="font-medium text-lg">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{t("orders.placedOn")} {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Badge className={getStatusColor(order.status)}>
                      {t(`orders.statuses.${order.status}`) || order.status}
                    </Badge>
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                    <Button asChild size="sm">
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t("orders.viewDetails")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("orders.myOrders")}</h1>
          <p className="text-gray-600">{t("orders.subtitle")}</p>
        </motion.div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("orders.filterTitle")}</CardTitle>
            <CardDescription>{t("orders.filterDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search" className="mb-2 block">
                  {t("orders.searchLabel")}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder={t("orders.searchPlaceholder")}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status" className="mb-2 block">
                  {t("orders.statusLabel")}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("orders.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("orders.allStatuses")}</SelectItem>
                    <SelectItem value="pending">{t("orders.statuses.pending")}</SelectItem>
                    <SelectItem value="processing">{t("orders.statuses.processing")}</SelectItem>
                    <SelectItem value="completed">{t("orders.statuses.completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("orders.statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date" className="mb-2 block">
                  {t("orders.dateRangeLabel")}
                </Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date">
                    <SelectValue placeholder={t("orders.allTime")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("orders.allTime")}</SelectItem>
                    <SelectItem value="last7days">{t("orders.last7Days")}</SelectItem>
                    <SelectItem value="last30days">{t("orders.last30Days")}</SelectItem>
                    <SelectItem value="last3months">{t("orders.last3Months")}</SelectItem>
                    <SelectItem value="last6months">{t("orders.last6Months")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="all">{t("orders.all")} ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">{t("orders.statuses.pending")} ({getOrdersByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="processing">{t("orders.statuses.processing")} ({getOrdersByStatus("processing").length})</TabsTrigger>
            <TabsTrigger value="completed">{t("orders.statuses.completed")} ({getOrdersByStatus("completed").length})</TabsTrigger>
            <TabsTrigger value="cancelled">{t("orders.statuses.cancelled")} ({getOrdersByStatus("cancelled").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderOrdersList(filteredOrders)}</TabsContent>

          <TabsContent value="pending">
            {renderOrdersList(filteredOrders.filter((order) => order.status === "pending"))}
          </TabsContent>

          <TabsContent value="processing">
            {renderOrdersList(filteredOrders.filter((order) => order.status === "processing"))}
          </TabsContent>

          <TabsContent value="completed">
            {renderOrdersList(filteredOrders.filter((order) => order.status === "completed"))}
          </TabsContent>

          <TabsContent value="cancelled">
            {renderOrdersList(filteredOrders.filter((order) => order.status === "cancelled"))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
