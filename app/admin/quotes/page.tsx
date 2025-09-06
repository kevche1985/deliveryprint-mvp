"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Mail, CheckCircle, Clock, XCircle, AlertCircle, FileText, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

type Quote = {
  id: string
  quote_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_company?: string
  service_type: string
  request_description: string
  urgency_level: "standard" | "urgent" | "rush"
  preferred_contact_method: "email" | "phone" | "both"
  best_contact_time: "morning" | "afternoon" | "evening" | "anytime"
  status: "new" | "pending" | "reviewed" | "approved" | "rejected"
  quote_amount?: number
  internal_notes?: string
  created_at: string
  valid_until: string
  prefilled_data?: any
}

type QuoteFile = {
  id: string
  quote_id: string
  original_filename: string
  file_size: number
  file_type: string
  uploaded_by: string
  created_at: string
}

export default function QuoteManagement() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>([])
  const [responseMessage, setResponseMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading quotes:", error)
        setError("Failed to load quotes: " + error.message)
        return
      }

      console.log("Loaded quotes:", data)
      setQuotes(data || [])
    } catch (error) {
      console.error("Error loading quotes:", error)
      setError("Failed to load quotes: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const loadQuoteFiles = async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from("quote_files")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading quote files:", error)
        return
      }

      setQuoteFiles(data || [])
    } catch (error) {
      console.error("Error loading quote files:", error)
    }
  }

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", quoteId)

      if (error) {
        console.error("Error updating quote status:", error)
        alert("Failed to update quote status: " + error.message)
        return
      }

      alert("Quote status updated successfully")
      loadQuotes()

      // Update selected quote if it's the one being updated
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus as any })
      }
    } catch (error) {
      console.error("Error updating quote status:", error)
      alert("Failed to update quote status: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const sendQuoteResponse = async () => {
    if (!selectedQuote || !responseMessage.trim()) {
      alert("Please enter a response message")
      return
    }

    try {
      // Update quote status to reviewed
      await updateQuoteStatus(selectedQuote.id, "reviewed")

      // In a real implementation, you would send an email here
      console.log("Sending response to:", selectedQuote.customer_email)
      console.log("Response message:", responseMessage)

      alert("Response sent to customer successfully")
      setResponseMessage("")
      setSelectedQuote(null)
    } catch (error) {
      console.error("Error sending response:", error)
      alert("Failed to send response")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-600"
      case "reviewed":
        return "bg-blue-600"
      case "rejected":
        return "bg-red-600"
      case "new":
        return "bg-purple-600"
      case "pending":
        return "bg-yellow-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return CheckCircle
      case "reviewed":
        return Mail
      case "rejected":
        return XCircle
      case "new":
        return AlertCircle
      default:
        return Clock
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "rush":
        return "text-red-600 bg-red-50"
      case "urgent":
        return "text-orange-600 bg-orange-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.service_type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const quoteStats = {
    total: quotes.length,
    new: quotes.filter((q) => q.status === "new").length,
    pending: quotes.filter((q) => q.status === "pending").length,
    reviewed: quotes.filter((q) => q.status === "reviewed").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
          <p className="text-gray-600">Loading quotes...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
          <p className="text-gray-600">Manage customer quote requests</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error loading quotes</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <Button onClick={loadQuotes} className="mt-4 bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quote Management</h1>
        <p className="text-gray-600">Manage customer quote requests</p>
      </div>

      {/* Quote Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total", value: quoteStats.total, color: "bg-gray-600" },
          { label: "New", value: quoteStats.new, color: "bg-purple-600" },
          { label: "Pending", value: quoteStats.pending, color: "bg-yellow-600" },
          { label: "Reviewed", value: quoteStats.reviewed, color: "bg-blue-600" },
          { label: "Approved", value: quoteStats.approved, color: "bg-green-600" },
          { label: "Rejected", value: quoteStats.rejected, color: "bg-red-600" },
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
                  placeholder="Search quotes..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadQuotes} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quotes ({filteredQuotes.length})</CardTitle>
          <CardDescription>Review and respond to customer quote requests</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No quotes found</p>
              <p className="text-gray-400">
                {quotes.length === 0 ? "No quotes have been submitted yet." : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const StatusIcon = getStatusIcon(quote.status)
                  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date()
                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium font-mono text-sm">{quote.quote_number}</p>
                          {isExpired && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.customer_name}</p>
                          <p className="text-sm text-gray-500">{quote.customer_email}</p>
                          {quote.customer_phone && <p className="text-sm text-gray-500">{quote.customer_phone}</p>}
                          {quote.customer_company && <p className="text-xs text-gray-400">{quote.customer_company}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {quote.service_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getUrgencyColor(quote.urgency_level)}`}>
                          {quote.urgency_level.charAt(0).toUpperCase() + quote.urgency_level.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date(quote.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">{new Date(quote.created_at).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedQuote(quote)
                                loadQuoteFiles(quote.id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Quote Details - {quote.quote_number}</DialogTitle>
                              <DialogDescription>Review quote request and send response</DialogDescription>
                            </DialogHeader>
                            {selectedQuote && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      Customer Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <strong>Name:</strong> {selectedQuote.customer_name}
                                      </p>
                                      <p>
                                        <strong>Email:</strong> {selectedQuote.customer_email}
                                      </p>
                                      <p>
                                        <strong>Phone:</strong> {selectedQuote.customer_phone}
                                      </p>
                                      {selectedQuote.customer_company && (
                                        <p>
                                          <strong>Company:</strong> {selectedQuote.customer_company}
                                        </p>
                                      )}
                                      <p>
                                        <strong>Preferred Contact:</strong> {selectedQuote.preferred_contact_method}
                                      </p>
                                      <p>
                                        <strong>Best Time:</strong> {selectedQuote.best_contact_time}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Quote Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <p>
                                        <strong>Service:</strong> {selectedQuote.service_type}
                                      </p>
                                      <p>
                                        <strong>Status:</strong>
                                        <Badge className={`ml-2 ${getStatusColor(selectedQuote.status)}`}>
                                          {selectedQuote.status}
                                        </Badge>
                                      </p>
                                      <p>
                                        <strong>Urgency:</strong>
                                        <Badge
                                          variant="outline"
                                          className={`ml-2 ${getUrgencyColor(selectedQuote.urgency_level)}`}
                                        >
                                          {selectedQuote.urgency_level}
                                        </Badge>
                                      </p>
                                      <p>
                                        <strong>Created:</strong> {new Date(selectedQuote.created_at).toLocaleString()}
                                      </p>
                                      {selectedQuote.valid_until && (
                                        <p>
                                          <strong>Valid Until:</strong>{" "}
                                          {new Date(selectedQuote.valid_until).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Project Description</h4>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{selectedQuote.request_description}</p>
                                  </div>
                                </div>

                                {selectedQuote.prefilled_data && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Configuration Details</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(JSON.parse(selectedQuote.prefilled_data), null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {quoteFiles.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Attached Files ({quoteFiles.length})</h4>
                                    <div className="space-y-2">
                                      {quoteFiles.map((file) => (
                                        <div
                                          key={file.id}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            <div>
                                              <p className="font-medium text-sm">{file.original_filename}</p>
                                              <p className="text-xs text-gray-500">
                                                {(file.file_size / 1024 / 1024).toFixed(1)} MB • {file.file_type}
                                              </p>
                                            </div>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {file.uploaded_by}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <h4 className="font-semibold mb-3">Update Status</h4>
                                  <Select
                                    value={selectedQuote.status}
                                    onValueChange={(value) => updateQuoteStatus(selectedQuote.id, value)}
                                  >
                                    <SelectTrigger className="w-full md:w-[200px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="reviewed">Reviewed</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Send Response</h4>
                                  <Textarea
                                    placeholder="Enter your response to the customer..."
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                                Close
                              </Button>
                              <Button onClick={sendQuoteResponse} className="bg-red-600 hover:bg-red-700">
                                <Mail className="mr-2 h-4 w-4" />
                                Send Response
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
