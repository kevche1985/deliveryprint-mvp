"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, X, Phone, Mail, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface QuoteRequestModalProps {
  isOpen: boolean
  onClose: () => void
  serviceType: string
  prefilledData?: any
}

interface UploadedFile {
  file: File
  id: string
  progress: number
  uploaded: boolean
  error?: string
}

export default function QuoteRequestModal({ isOpen, onClose, serviceType, prefilledData }: QuoteRequestModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    serviceType: serviceType,
    requestDescription: "",
    urgencyLevel: "standard",
    preferredContactMethod: "email",
    bestContactTime: "anytime",
  })

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [quoteReference, setQuoteReference] = useState("")

  // Character count for description
  const maxDescriptionLength = 2000
  const minDescriptionLength = 20

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (files: File[]) => {
    // Check file limits
    if (uploadedFiles.length + files.length > 10) {
      alert("Maximum 10 files allowed per quote request")
      return
    }

    const validFiles = files.filter((file) => {
      // Check file size limits
      const maxSizes = {
        image: 10 * 1024 * 1024, // 10MB for images
        "application/pdf": 25 * 1024 * 1024, // 25MB for PDFs
        application: 50 * 1024 * 1024, // 50MB for design files
        archive: 100 * 1024 * 1024, // 100MB for archives
      }

      let maxSize = 10 * 1024 * 1024 // Default 10MB
      if (file.type.startsWith("image/")) maxSize = maxSizes.image
      else if (file.type === "application/pdf") maxSize = maxSizes["application/pdf"]
      else if (file.type.includes("zip") || file.type.includes("rar")) maxSize = maxSizes.archive
      else if (file.type.startsWith("application/")) maxSize = maxSizes.application

      if (file.size > maxSize) {
        alert(`${file.name} exceeds the maximum size limit`)
        return false
      }

      return true
    })

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      uploaded: false,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.customerName.trim()) errors.push("Name is required")
    if (!formData.customerEmail.trim()) errors.push("Email is required")
    if (!formData.customerPhone.trim()) errors.push("Phone number is required")
    if (!formData.requestDescription.trim()) errors.push("Request description is required")
    if (formData.requestDescription.length < minDescriptionLength) {
      errors.push(`Description must be at least ${minDescriptionLength} characters`)
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.customerEmail)) {
      errors.push("Please enter a valid email address")
    }

    if (errors.length > 0) {
      alert("Please fix the following errors: " + errors.join(", "))
      return false
    }

    return true
  }

  const generateQuoteReference = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `QR-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const reference = generateQuoteReference()

      // Get current user if logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Prepare quote data for database
      const quoteData = {
        quote_number: reference,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_company: formData.customerCompany || null,
        service_type: formData.serviceType,
        request_description: formData.requestDescription,
        urgency_level: formData.urgencyLevel,
        preferred_contact_method: formData.preferredContactMethod,
        best_contact_time: formData.bestContactTime,
        status: "new",
        customer_id: user?.id || null,
        created_by: user?.id || null,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        currency: "USD",
        prefilled_data: prefilledData ? JSON.stringify(prefilledData) : null,
      }

      // Insert quote into database
      const { data: quote, error: quoteError } = await supabase.from("quotes").insert([quoteData]).select().single()

      if (quoteError) {
        console.error("Error creating quote:", quoteError)
        throw new Error("Failed to create quote: " + quoteError.message)
      }

      // Handle file uploads if any
      if (uploadedFiles.length > 0) {
        const fileRecords = []

        for (const uploadedFile of uploadedFiles) {
          try {
            // Upload file to Supabase storage
            const fileExt = uploadedFile.file.name.split(".").pop()
            const fileName = `${quote.id}/${uploadedFile.id}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from("quote-files")
              .upload(fileName, uploadedFile.file)

            if (uploadError) {
              console.error("File upload error:", uploadError)
              continue // Skip this file but continue with others
            }

            // Create file record in database
            const fileRecord = {
              quote_id: quote.id,
              original_filename: uploadedFile.file.name,
              stored_filename: fileName,
              file_size: uploadedFile.file.size,
              file_type: uploadedFile.file.type,
              uploaded_by: "customer",
            }

            fileRecords.push(fileRecord)
          } catch (fileError) {
            console.error("File processing error:", fileError)
            // Continue with other files
          }
        }

        // Insert file records if any were successfully uploaded
        if (fileRecords.length > 0) {
          const { error: filesError } = await supabase.from("quote_files").insert(fileRecords)

          if (filesError) {
            console.error("Error saving file records:", filesError)
            // Don't fail the entire request for file errors
          }
        }
      }

      setQuoteReference(reference)
      setSubmitted(true)

      console.log("Quote submitted successfully:", quote)
    } catch (error) {
      console.error("Quote submission error:", error)
      alert(
        "Submission failed. Please try again or contact support. Error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmitted(false)
    setQuoteReference("")
    setUploadedFiles([])
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCompany: "",
      serviceType: serviceType,
      requestDescription: "",
      urgencyLevel: "standard",
      preferredContactMethod: "email",
      bestContactTime: "anytime",
    })
  }

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Quote Request Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Request Submitted Successfully!</h3>
              <p className="text-gray-600 mb-4">Your quote request has been received and assigned reference number:</p>
              <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                {quoteReference}
              </Badge>
              <p className="text-sm text-gray-500 mt-4">
                We'll review your request and contact you within 24 hours using your preferred contact method.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Submit Another Request
            </Button>
            <Button onClick={onClose} className="flex-1 bg-red-600 hover:bg-red-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Quote - {serviceType}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Information */}
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Service Selected</h3>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {serviceType}
            </Badge>
            {prefilledData && (
              <p className="text-sm text-gray-600 mt-2">
                Your current configuration will be included with this quote request.
              </p>
            )}
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
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
                required
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerCompany">Company (Optional)</Label>
              <Input
                id="customerCompany"
                value={formData.customerCompany}
                onChange={(e) => handleInputChange("customerCompany", e.target.value)}
              />
            </div>
          </div>

          {/* Request Description */}
          <div>
            <Label htmlFor="requestDescription">Project Description *</Label>
            <Textarea
              id="requestDescription"
              value={formData.requestDescription}
              onChange={(e) => handleInputChange("requestDescription", e.target.value)}
              placeholder="Please describe your project requirements, specifications, quantity, timeline, and any special instructions..."
              rows={6}
              maxLength={maxDescriptionLength}
              required
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Minimum {minDescriptionLength} characters</span>
              <span>
                {formData.requestDescription.length}/{maxDescriptionLength}
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>Attach Files (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.pdf,.doc,.docx,.txt,.ai,.psd,.eps,.svg,.zip,.rar"
              onChange={handleFileInput}
              className="hidden"
            />
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-red-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Drop files here or click to browse</p>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Max 10 files. Images (10MB), PDFs (25MB), Design files (50MB), Archives (100MB)
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Uploaded Files ({uploadedFiles.length}/10)</h4>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm truncate">{file.file.name}</span>
                      <span className="text-xs text-gray-500">({(file.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Urgency Level</Label>
              <Select value={formData.urgencyLevel} onValueChange={(value) => handleInputChange("urgencyLevel", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                  <SelectItem value="urgent">Urgent (1-2 days)</SelectItem>
                  <SelectItem value="rush">Rush (Same day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred Contact Method</Label>
              <RadioGroup
                value={formData.preferredContactMethod}
                onValueChange={(value) => handleInputChange("preferredContactMethod", value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone" />
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Both</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Best Time to Contact</Label>
              <Select
                value={formData.bestContactTime}
                onValueChange={(value) => handleInputChange("bestContactTime", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                  <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quote Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add named export
export { default as QuoteRequestModal } from './quote-request-modal'
