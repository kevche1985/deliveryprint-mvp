"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import {
  Upload,
  Type,
  ZoomIn,
  ZoomOut,
  Trash2,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Square,
  Circle,
  Triangle,
  Undo,
  Redo,
  Crop,
  AlertCircle,
  RotateCcw,
} from "lucide-react"
import ReactCrop, { type Crop as CropperCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import html2canvas from "html2canvas"
import { toast } from "@/components/ui/use-toast"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"

// Add this after the other hooks
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Helper function to use when cropping an image with an aspect ratio
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

// Helper to generate unique product name
function generateProductName(userEmail: string | null, productName: string | null): string {
  const username = userEmail ? userEmail.split("@")[0] : "user"
  const baseProductName = productName || "custom-design"
  const now = new Date()
  const timestamp = now.toISOString().replace("T", "-").replace(/:/g, "-").split(".")[0]
  return `${username}-${baseProductName}-${timestamp}`
}

interface DesignElement {
  id: number
  type: "image" | "text" | "shape"
  x: number
  y: number
  rotation: number
  flipX: boolean
  flipY: boolean
  opacity: number
  src?: string
  originalSrc?: string
  width?: number
  height?: number
  content?: string
  fontSize?: number
  color?: string
  fontFamily?: string
  shapeType?: "rectangle" | "circle" | "triangle"
  fill?: string
  stroke?: string
  strokeWidth?: number
  aspectRatio?: number
}

export interface DesignOutputData {
  elements: DesignElement[]
  printArea: { x: number; y: number; width: number; height: number }
  baseProductImage: string
  timestamp: number
  customizedProductImage: string
}

interface DesignEditorProps {
  productImage?: string
  printArea?: {
    x: number
    y: number
    width: number
    height: number
  }
  onSave?: (designData: DesignOutputData) => void
  onCancel?: () => void
  initialDesign?: {
    elements: DesignElement[]
    zoom: number
    productImage: string
  } | null
  productName?: string
  product?: any
  variants?: any[]
  selectedVariant?: string
}

const DesignEditor: React.FC<DesignEditorProps> = ({
  productImage = "/placeholder.svg?width=600&height=600&text=Product+Mockup",
  printArea = { x: 0, y: 0, width: 600, height: 600 },
  onSave,
  onCancel,
  initialDesign,
  productName,
  product,
  variants = [],
  selectedVariant,
}) => {
  const [elements, setElements] = useState<DesignElement[]>(initialDesign?.elements || [])
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null)
  const [draggedElementId, setDraggedElementId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(initialDesign?.zoom || 1)
  const [activeTab, setActiveTab] = useState("upload")
  const [isDraggingCanvasElement, setIsDraggingCanvasElement] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [textColor, setTextColor] = useState("#000000")
  const [textSize, setTextSize] = useState(24)
  const [history, setHistory] = useState<DesignElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const designViewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Crop State ---
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<{
    id: number
    src: string
    originalSrc?: string
    aspectRatio?: number
  } | null>(null)
  const [crop, setCrop] = useState<CropperCrop | undefined>()
  const [completedCrop, setCompletedCrop] = useState<CropperCrop | null>(null)
  const cropPreviewCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropImageRef = useRef<HTMLImageElement>(null)
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined)

  const { addItem } = useCart()
  const { user } = useAuth()
  const { t } = useLanguage()

  // Add to history for undo/redo
  const addToHistory = useCallback(
    (newElements: DesignElement[]) => {
      const currentHistory = history.slice(0, historyIndex + 1)
      currentHistory.push([...newElements])
      setHistory(currentHistory)
      setHistoryIndex(currentHistory.length - 1)
    },
    [history, historyIndex],
  )

  useEffect(() => {
    if (elements.length > 0 && history.length === 0) {
      addToHistory(elements)
    }
  }, [elements, history.length, addToHistory])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prevIndex) => prevIndex - 1)
      setElements([...history[historyIndex - 1]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prevIndex) => prevIndex + 1)
      setElements([...history[historyIndex + 1]])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const processAndAddImageElement = useCallback(
    (fileSrc: string, originalFile?: File) => {
      const img = new Image()
      img.onload = () => {
        const aspectRatio = img.width / img.height
        const initialWidth = Math.min(200, printArea.width * 0.5, img.width)
        const initialHeight = initialWidth / aspectRatio

        const newElement: DesignElement = {
          id: Date.now(),
          type: "image",
          src: fileSrc,
          originalSrc: fileSrc,
          x: printArea.x + (printArea.width - initialWidth) / 2,
          y: printArea.y + (printArea.height - initialHeight) / 2,
          width: initialWidth,
          height: initialHeight,
          rotation: 0,
          flipX: false,
          flipY: false,
          opacity: 1,
          aspectRatio: aspectRatio,
        }

        setElements((prevElements) => {
          const updatedElements = [...prevElements, newElement]
          addToHistory(updatedElements)
          return updatedElements
        })
        setSelectedElementId(newElement.id)
      }
      img.src = fileSrc
    },
    [printArea, addToHistory],
  )

  const handleImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, JPEG, WEBP, GIF)")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          processAndAddImageElement(e.target.result as string, file)
        }
      }
      reader.readAsDataURL(file)
    },
    [processAndAddImageElement],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith("image/"))
      if (imageFile) {
        handleImageFile(imageFile)
      }
    },
    [handleImageFile],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
    if (e.target) e.target.value = ""
  }

  const addText = () => {
    if (!textInput.trim()) return
    const newElement: DesignElement = {
      id: Date.now(),
      type: "text",
      content: textInput,
      x: printArea.x + printArea.width / 2 - 50,
      y: printArea.y + printArea.height / 2 - 12,
      fontSize: textSize,
      color: textColor,
      rotation: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      fontFamily: "Arial, sans-serif",
    }
    setElements((prevElements) => {
      const updatedElements = [...prevElements, newElement]
      addToHistory(updatedElements)
      return updatedElements
    })
    setSelectedElementId(newElement.id)
    setTextInput("")
  }

  const addShape = (shapeType: "rectangle" | "circle" | "triangle") => {
    const newElement: DesignElement = {
      id: Date.now(),
      type: "shape",
      shapeType,
      x: printArea.x + (printArea.width - 100) / 2,
      y: printArea.y + (printArea.height - 100) / 2,
      width: 100,
      height: 100,
      fill: "#3B82F6",
      stroke: "#1E40AF",
      strokeWidth: 2,
      rotation: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
    }
    setElements((prevElements) => {
      const updatedElements = [...prevElements, newElement]
      addToHistory(updatedElements)
      return updatedElements
    })
    setSelectedElementId(newElement.id)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>, elementId: number | null = null) => {
    if (!canvasContainerRef.current) return
    const rect = canvasContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (elementId) {
      const element = elements.find((el) => el.id === elementId)
      if (element) {
        setSelectedElementId(elementId)
        setDraggedElementId(elementId)
        setDragOffset({
          x: x - element.x,
          y: y - element.y,
        })
        setIsDraggingCanvasElement(true)
      }
    } else {
      setSelectedElementId(null)
    }
  }

  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingCanvasElement || draggedElementId === null || !canvasContainerRef.current) return

      const rect = canvasContainerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      setElements((prevElements) =>
        prevElements.map((element) => {
          if (element.id === draggedElementId) {
            let newX = x - dragOffset.x
            let newY = y - dragOffset.y

            const elWidth =
              element.width ||
              (element.type === "text" ? (element.content?.length || 0) * (element.fontSize || 0) * 0.6 : 20)
            const elHeight = element.height || element.fontSize || 20

            newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - elWidth))
            newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - elHeight))

            return { ...element, x: newX, y: newY }
          }
          return element
        }),
      )
    },
    [isDraggingCanvasElement, draggedElementId, dragOffset, zoom, printArea, elements],
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (isDraggingCanvasElement) {
      addToHistory(elements)
    }
    setIsDraggingCanvasElement(false)
    setDraggedElementId(null)
  }, [isDraggingCanvasElement, elements, addToHistory])

  useEffect(() => {
    document.addEventListener("mousemove", handleCanvasMouseMove)
    document.addEventListener("mouseup", handleCanvasMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleCanvasMouseMove)
      document.removeEventListener("mouseup", handleCanvasMouseUp)
    }
  }, [handleCanvasMouseMove, handleCanvasMouseUp])

  const updateSelectedElement = (updates: Partial<DesignElement>) => {
    const newElements = elements.map((element) =>
      element.id === selectedElementId ? { ...element, ...updates } : element,
    )
    setElements(newElements)
  }

  const commitSelectedElementUpdate = (updates: Partial<DesignElement>) => {
    const newElements = elements.map((element) =>
      element.id === selectedElementId ? { ...element, ...updates } : element,
    )
    setElements(newElements)
    addToHistory(newElements)
  }

  const deleteSelected = () => {
    if (selectedElementId !== null) {
      const newElements = elements.filter((el) => el.id !== selectedElementId)
      setElements(newElements)
      addToHistory(newElements)
      setSelectedElementId(null)
    }
  }

  const duplicateSelected = () => {
    if (selectedElementId !== null) {
      const elementToDuplicate = elements.find((el) => el.id === selectedElementId)
      if (elementToDuplicate) {
        const newElement = {
          ...elementToDuplicate,
          id: Date.now(),
          x: elementToDuplicate.x + 20,
          y: elementToDuplicate.y + 20,
        }
        const newElements = [...elements, newElement]
        setElements(newElements)
        addToHistory(newElements)
        setSelectedElementId(newElement.id)
      }
    }
  }

  const handleSave = async () => {
    // Ensure we always reset loading state
    let isLoadingStateSet = false
    
    try {
      if (!designViewportRef.current) {
        console.error("Design viewport ref not found for capturing.")
        toast({ title: t("designEditor.errorTitle"), description: t("designEditor.captureError"), variant: "destructive" })
        return
      }

      setErrorMessage(null)
      setIsSaving(true)
      isLoadingStateSet = true

      console.log("🎨 Starting design save process...")

      // Generate unique product name automatically
      const userEmail = user?.email ?? null
      const generatedProductName = generateProductName(userEmail, productName || 'Custom Design')
      console.log("📝 Generated product name:", generatedProductName)

      // Validate required data
      if (elements.length === 0) {
        throw new Error("Please add at least one design element before saving")
      }

      console.log("🔐 User authentication check:", {
        hasUser: !!user,
        userEmail: user?.email,
        userObject: user
      })
      
      if (!user?.email) {
        console.error("❌ User authentication failed:", {
          user: user,
          hasUser: !!user,
          hasEmail: !!user?.email,
          email: user?.email
        })
        throw new Error("Please log in to be able to personalize products")
      }
      
      console.log("✅ User authenticated:", user.email)

      // Show initial loading toast
      const loadingToast = toast({ title: t("designEditor.savingTitle"), description: t("designEditor.savingDesc"), duration: 0 })

      // Temporarily set transform-origin to top left for html2canvas
      const originalTransformOrigin = designViewportRef.current.style.transformOrigin
      designViewportRef.current.style.transformOrigin = "top left"

      console.log("📸 Capturing design canvas...")
      
      // Add timeout protection for canvas capture with shorter timeout
      const capturePromise = html2canvas(designViewportRef.current, {
        useCORS: true,
        scale: 1.5, // Reduced scale for faster processing
        logging: false,
        backgroundColor: null,
        allowTaint: true,
        foreignObjectRendering: true,
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Canvas capture timeout. Please try a simpler design.')), 15000) // Reduced to 15s
      )
      
      const canvas = await Promise.race([capturePromise, timeoutPromise]) as HTMLCanvasElement

      // Revert transform-origin
      designViewportRef.current.style.transformOrigin = originalTransformOrigin

      // Get image with reasonable quality
      const capturedImageBase64 = canvas.toDataURL("image/png", 0.9) // Slightly reduced quality for speed
      const sizeInMB = capturedImageBase64.length / (1024 * 1024)
      console.log(`📏 Image size: ${sizeInMB.toFixed(2)}MB`)

      // Check if under 8MB limit (reduced from 10MB)
      if (sizeInMB > 8) {
        throw new Error(`Image too large (${sizeInMB.toFixed(2)}MB). Please simplify your design to stay under 8MB.`)
      }

      // Prepare design data
      const elementsToSave = elements.map((el) => ({ ...el }))
      const designData = {
        elements: elementsToSave,
        printArea,
        baseProductImage: productImage,
        timestamp: Date.now(),
        customizedProductImage: capturedImageBase64,
      }

      // Generate a unique ID for the design
      const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Prepare API request data
      const requestData = {
        id: designId,
        name: generatedProductName,
        description: `Custom designed ${productName || "product"} with ${elements.length} design elements`,
        type: "image",
        file_data: {
          design_data: designData,
          formats: ["png", "pdf", "svg", "jpg"],
          canvas_data: capturedImageBase64,
        },
        generation_inputs: {
          base_product: productName,
          base_product_id: product?.id,
          elements_count: elements.length,
          print_area: printArea,
          user_email: user?.email,
          generated_name: generatedProductName,
        },
        base_price: product?.price || 0,
        preview_url: capturedImageBase64,
      }

      console.log("📦 Request data prepared")

      // Get auth token for API request
      console.log("🔑 Getting auth token...")
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        console.error("❌ Failed to get session:", sessionError)
        throw new Error("Please log in again to save your design")
      }

      const authToken = session.access_token
      console.log("✅ Auth token obtained")
      
      // Send to API with shorter timeout
      console.log("📡 Uploading design...")
      let digitalProductResponse: Response
      
      // Reduced timeout to 30 seconds
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.log("⏰ API request timed out")
      }, 30000)
      
      try {
        digitalProductResponse = await fetch("/api/digital-products/create-memory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error("❌ Network error:", fetchError)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("Upload timeout. Please try again with a simpler design.")
        }
        throw new Error("Network error. Please check your connection and try again.")
      }

      console.log("📨 API response received:", digitalProductResponse.status)

      // Parse response
      let responseData: any
      try {
        responseData = await digitalProductResponse.json()
      } catch (jsonError) {
        console.error("❌ Failed to parse response:", jsonError)
        throw new Error("Invalid server response. Please try again.")
      }

      // Check for errors
      if (!digitalProductResponse.ok || !responseData.success) {
        const errorMessage = responseData?.error || `Upload failed: ${digitalProductResponse.status}`
        console.error("❌ API error:", responseData)
        throw new Error(errorMessage)
      }

      // Use the response data
      const digitalProduct = responseData
      console.log("✅ Design saved successfully:", digitalProduct.product?.id)

      // Find the selected variant for pricing
      const variant = variants.find((v) => v.id === selectedVariant)
      const finalPrice = variant ? variant.price : product?.price || 0

      // Use the stored image URL from Supabase Storage with fallback
      const apiPreviewUrl = digitalProduct.product?.preview_url || digitalProduct.preview_url
      const apiDownloadUrl = digitalProduct.product?.download_url || digitalProduct.download_url
      
      // Prefer API URLs over base64, but use base64 as last resort
      const storedImageUrl = apiPreviewUrl || apiDownloadUrl || capturedImageBase64
      
      const productDisplayName = `${generatedProductName} - Custom Design`

      console.log("🛒 Image URL analysis:", {
        apiPreviewUrl: apiPreviewUrl ? apiPreviewUrl.substring(0, 100) + '...' : 'None',
        apiDownloadUrl: apiDownloadUrl ? apiDownloadUrl.substring(0, 100) + '...' : 'None',
        usingFallback: !apiPreviewUrl && !apiDownloadUrl,
        finalUrlType: storedImageUrl?.startsWith('data:') ? 'base64' : storedImageUrl?.startsWith('http') ? 'url' : 'unknown',
        finalUrlLength: storedImageUrl?.length
      })
      
      console.log("📄 Digital product response structure:", {
        hasProduct: !!digitalProduct.product,
        hasPreviewUrl: !!digitalProduct.product?.preview_url,
        hasDownloadUrl: !!digitalProduct.product?.download_url,
        directPreviewUrl: !!digitalProduct.preview_url,
        directDownloadUrl: !!digitalProduct.download_url
      })

      // Add to cart
      addItem({
        productId: product?.id || "custom-design",
        variantId: selectedVariant || undefined,
        designId: digitalProduct.product?.id || digitalProduct.id,
        quantity: 1,
        price: finalPrice,
        name: productDisplayName,
        image: storedImageUrl,
        customizations: {
          designId: digitalProduct.product?.id || digitalProduct.id,
          is_custom_design: true,
          formats_available: ["png", "pdf", "svg", "jpg"],
          generated_name: generatedProductName,
          storage_url: storedImageUrl,
          elements_count: elements.length,
        },
      })

      // Dismiss loading toast
      if (loadingToast.dismiss) {
        loadingToast.dismiss()
      }

      // Success toast
      toast({
        title: "Design Saved Successfully! 🎨",
        description: `${productDisplayName} added to cart`,
        duration: 3000,
      })

      // Call original onSave if provided with enhanced data
      if (onSave) {
        const enhancedDesignData = {
          ...designData,
          customizedProductImage: storedImageUrl,
          // Ensure we have the image for thumbnail display
          preview_url: storedImageUrl,
          download_url: storedImageUrl,
          // Add metadata for debugging
          saved_at: new Date().toISOString(),
          design_id: digitalProduct.product?.id || digitalProduct.id
        }
        
        console.log("💾 Saving design data for thumbnail:", {
          hasCustomizedProductImage: !!enhancedDesignData.customizedProductImage,
          hasPreviewUrl: !!enhancedDesignData.preview_url,
          imageUrlType: enhancedDesignData.customizedProductImage?.startsWith('data:') ? 'base64' : enhancedDesignData.customizedProductImage?.startsWith('http') ? 'url' : 'unknown',
          imageUrlLength: enhancedDesignData.customizedProductImage?.length,
          imageUrlPreview: enhancedDesignData.customizedProductImage?.substring(0, 100) + '...'
        })
        
        onSave(enhancedDesignData)
      }

    } catch (error) {
      console.error("💥 Save error:", error)

      let userFriendlyMessage = "Could not save your design. Please try again."

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()

        if (errorMsg.includes("timeout")) {
          userFriendlyMessage = "Save timeout. Please try a simpler design or check your connection."
        } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
          userFriendlyMessage = "Network error. Please check your connection and try again."
        } else if (errorMsg.includes("unauthorized") || errorMsg.includes("401")) {
          userFriendlyMessage = "Please log in to be able to personalize products"
        } else if (errorMsg.includes("too large")) {
          userFriendlyMessage = error.message
        } else if (error.message.length < 100) {
          userFriendlyMessage = error.message
        }
      }

      setErrorMessage(userFriendlyMessage)

      toast({
        title: "Error Saving Design",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      // ALWAYS reset loading state
      if (isLoadingStateSet) {
        setIsSaving(false)
        console.log("🔄 Loading state reset")
      }
    }
  }

  const selected = elements.find((el) => el.id === selectedElementId)

  // --- Crop Logic ---
  const openCropModal = () => {
    if (selected && selected.type === "image" && selected.src) {
      setImageToCrop({
        id: selected.id,
        src: selected.originalSrc || selected.src,
        originalSrc: selected.originalSrc || selected.src,
        aspectRatio: selected.aspectRatio,
      })
      setCropAspect(selected.aspectRatio)
      setIsCropModalOpen(true)
    }
  }

  const onImageLoadForCrop = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (cropAspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, cropAspect))
    }
  }

  const applyCrop = () => {
    if (!completedCrop || !cropImageRef.current || !cropPreviewCanvasRef.current || !imageToCrop) {
      return
    }
    const image = cropImageRef.current
    const canvas = cropPreviewCanvasRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("No 2d context")
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const base64Image = canvas.toDataURL("image/png")

    const newElements = elements.map((el) => {
      if (el.id === imageToCrop.id && el.type === "image") {
        const oldWidth = el.width || 1
        const oldHeight = el.height || 1
        const newAspectRatio = canvas.width / canvas.height

        let newWidth, newHeight
        if (oldWidth / oldHeight > newAspectRatio) {
          newHeight = oldHeight
          newWidth = newHeight * newAspectRatio
        } else {
          newWidth = oldWidth
          newHeight = newWidth / newAspectRatio
        }

        return {
          ...el,
          src: base64Image,
          originalSrc: imageToCrop.originalSrc,
          width: newWidth,
          height: newHeight,
          aspectRatio: newAspectRatio,
        }
      }
      return el
    })
    setElements(newElements)
    addToHistory(newElements)
    setIsCropModalOpen(false)
    setCompletedCrop(null)
    setCrop(undefined)
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">
          {t("designEditor.title")} {productName ? `${t("designEditor.forProduct")} ${productName}` : ""}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} title={t("designEditor.undo")}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title={t("designEditor.redo")}>
            <Redo className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleSave} 
            size="sm" 
            className="bg-red-700 hover:bg-red-800 text-white" 
            disabled={isSaving}
            data-save-design
          >
            {isSaving ? t("designEditor.savingShort") : t("designEditor.saveDesign")}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="m-3">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Saving Design</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <div className="mt-2 text-xs">
              <p>Please try again or contact support if the problem persists.</p>
              <details className="mt-1">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(
                    {
                      elementsCount: elements.length,
                      productName,
                      hasProduct: !!product,
                      userEmail: user?.email,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex" style={{ height: "calc(100vh - 12rem)", minHeight: "600px" }}>
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          <Tabs defaultValue="upload" className="flex flex-col flex-grow">
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-1 inline-block" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="w-4 h-4 mr-1 inline-block" />
                Text
              </TabsTrigger>
              <TabsTrigger value="shapes">
                <Square className="w-4 h-4 mr-1 inline-block" />
                Shapes
              </TabsTrigger>
            </TabsList>

            <div className="p-4 overflow-y-auto flex-grow">
              <TabsContent value="upload" className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors cursor-pointer bg-white"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-600 mb-1">{t("designEditor.upload.dragDrop")}</p>
                  <p className="text-xs text-gray-500">{t("designEditor.upload.maxSize")}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </TabsContent>

              <TabsContent value="text" className="space-y-3">
                <div>
                  <Label htmlFor="text-input" className="text-xs">{t("designEditor.text.contentLabel")}</Label>
                  <Input
                    id="text-input"
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t("designEditor.text.placeholder")}
                    className="mt-1"
                    onKeyPress={(e) => e.key === "Enter" && addText()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">{t("designEditor.text.color")}</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-9 mt-1 p-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{`${t("designEditor.text.size")} (${textSize}px)`}</Label>
                    <Slider
                      value={[textSize]}
                      onValueChange={(val) => setTextSize(val[0])}
                      min={10}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
                <Button
                  onClick={addText}
                  disabled={!textInput.trim()}
                  className="w-full bg-red-700 hover:bg-red-800 text-white"
                >
                  Add Text
                </Button>
              </TabsContent>

              <TabsContent value="shapes" className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["rectangle", Square],
                      ["circle", Circle],
                      ["triangle", Triangle],
                    ] as const
                  ).map(([shape, Icon]) => (
                    <Button
                      key={shape}
                      variant="outline"
                      onClick={() => addShape(shape)}
                      className="flex flex-col items-center h-auto py-2"
                    >
                      <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs capitalize">{t(`designEditor.shapes.${shape}`)}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Element Properties */}
          {selected && (
            <div
              className="border-t border-gray-200 p-4 space-y-4 overflow-y-auto shrink-0 bg-white"
              style={{ minHeight: "300px", maxHeight: "50%" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{t("designEditor.elementProps.title")}</h3>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {t(`designEditor.elementProps.type.${selected.type}`)}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-medium text-gray-700">{t("designEditor.elementProps.positionSize")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{t("designEditor.elementProps.xPos")}</Label>
                    <Input
                      type="number"
                      value={Math.round(selected.x)}
                      onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                      onBlur={() => commitSelectedElementUpdate({})}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("designEditor.elementProps.yPos")}</Label>
                    <Input
                      type="number"
                      value={Math.round(selected.y)}
                      onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                      onBlur={() => commitSelectedElementUpdate({})}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              {(selected.type === "image" || selected.type === "shape") && (
                <>
                  <div>
                    <Label className="text-xs font-medium">{`${t("designEditor.elementProps.elementSize")} (${Math.round(((selected.width || 0) / 100) * 100)}%)`}</Label>
                    <div className="mt-2">
                      <Slider
                        value={[selected.width || 100]}
                        onValueChange={(v) => {
                          const newWidth = v[0]
                          updateSelectedElement({
                            width: newWidth,
                            ...(selected.type === "image" &&
                              selected.aspectRatio && { height: newWidth / selected.aspectRatio }),
                          })
                        }}
                        onValueCommit={(v) => {
                          const newWidth = v[0]
                          commitSelectedElementUpdate({
                            width: newWidth,
                            ...(selected.type === "image" &&
                              selected.aspectRatio && { height: newWidth / selected.aspectRatio }),
                          })
                        }}
                        min={20}
                        max={600}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{t("designEditor.sizeScale.small")}</span>
                      <span>{t("designEditor.sizeScale.medium")}</span>
                      <span>{t("designEditor.sizeScale.large")}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">{t("designEditor.elementProps.width")}</Label>
                      <Input
                        type="number"
                        value={Math.round(selected.width || 0)}
                        onChange={(e) =>
                          updateSelectedElement({
                            width: Number(e.target.value),
                            ...(selected.type === "image" &&
                              selected.aspectRatio && { height: Number(e.target.value) / selected.aspectRatio }),
                          })
                        }
                        onBlur={() => commitSelectedElementUpdate({})}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("designEditor.elementProps.height")}</Label>
                      <Input
                        type="number"
                        value={Math.round(selected.height || 0)}
                        onChange={(e) =>
                          updateSelectedElement({
                            height: Number(e.target.value),
                            ...(selected.type === "image" &&
                              selected.aspectRatio && { width: Number(e.target.value) * selected.aspectRatio }),
                          })
                        }
                        onBlur={() => commitSelectedElementUpdate({})}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentWidth = selected.width || 100
                        const newWidth = Math.max(20, currentWidth * 0.8)
                        commitSelectedElementUpdate({
                          width: newWidth,
                          ...(selected.type === "image" &&
                            selected.aspectRatio && { height: newWidth / selected.aspectRatio }),
                        })
                      }}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <ZoomOut className="w-4 h-4" />
                      <span className="text-xs">{t("designEditor.actions.zoomOut")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const originalWidth = selected.type === "image" ? 200 : 100
                        commitSelectedElementUpdate({
                          width: originalWidth,
                          ...(selected.type === "image" &&
                            selected.aspectRatio && { height: originalWidth / selected.aspectRatio }),
                        })
                      }}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span className="text-xs">{t("designEditor.actions.reset")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentWidth = selected.width || 100
                        const newWidth = Math.min(600, currentWidth * 1.25)
                        commitSelectedElementUpdate({
                          width: newWidth,
                          ...(selected.type === "image" &&
                            selected.aspectRatio && { height: newWidth / selected.aspectRatio }),
                        })
                      }}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-xs">{t("designEditor.actions.zoomIn")}</span>
                    </Button>
                  </div>
                </>
              )}

              {selected.type === "text" && (
                <>
                  <div>
                    <Label className="text-xs">{`${t("designEditor.text.fontSize")} (${selected.fontSize}px)`}</Label>
                    <Slider
                      value={[selected.fontSize || 24]}
                      onValueChange={(v) => updateSelectedElement({ fontSize: v[0] })}
                      onValueCommit={(v) => commitSelectedElementUpdate({ fontSize: v[0] })}
                      min={10}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("designEditor.text.color")}</Label>
                    <Input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateSelectedElement({ color: e.target.value })}
                      onBlur={() => commitSelectedElementUpdate({})}
                      className="w-full h-8 p-1"
                    />
                  </div>
                </>
              )}
              {selected.type === "shape" && (
                <>
                  <div>
                    <Label className="text-xs">Fill</Label>
                    <Input
                      type="color"
                      value={selected.fill}
                      onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                      onBlur={() => commitSelectedElementUpdate({})}
                      className="w-full h-8 p-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("designEditor.shape.stroke")}</Label>
                    <Input
                      type="color"
                      value={selected.stroke}
                      onChange={(e) => updateSelectedElement({ stroke: e.target.value })}
                      onBlur={() => commitSelectedElementUpdate({})}
                      className="w-full h-8 p-1"
                    />
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">{`${t("designEditor.elementProps.rotation")} (${selected.rotation}°)`}</Label>
                  <div className="mt-2">
                    <Slider
                      value={[selected.rotation]}
                      onValueChange={(v) => updateSelectedElement({ rotation: v[0] })}
                      onValueCommit={(v) => commitSelectedElementUpdate({ rotation: v[0] })}
                      min={0}
                      max={359}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0°</span>
                    <span>180°</span>
                    <span>359°</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">{`${t("designEditor.elementProps.opacity")} (${Math.round((selected.opacity || 1) * 100)}%)`}</Label>
                  <div className="mt-2">
                    <Slider
                      value={[selected.opacity || 1]}
                      onValueChange={(v) => updateSelectedElement({ opacity: v[0] })}
                      onValueCommit={(v) => commitSelectedElementUpdate({ opacity: v[0] })}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <Label className="text-xs font-medium text-gray-700">{t("designEditor.actions.title")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => commitSelectedElementUpdate({ flipX: !selected.flipX })}
                    title={t("designEditor.actions.flipH")}
                    className={`flex flex-col items-center gap-1 h-auto py-2 ${selected.flipX ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span className="text-xs">{t("designEditor.actions.flipHShort")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => commitSelectedElementUpdate({ flipY: !selected.flipY })}
                    title={t("designEditor.actions.flipV")}
                    className={`flex flex-col items-center gap-1 h-auto py-2 ${selected.flipY ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span className="text-xs">{t("designEditor.actions.flipVShort")}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={duplicateSelected} 
                    title={t("designEditor.actions.duplicate")} 
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">{t("designEditor.actions.copy")}</span>
                  </Button>
                </div>
                
                {selected.type === "image" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openCropModal} 
                    className="w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Crop className="w-4 h-4" /> 
                    <span>{t("designEditor.actions.cropImage")}</span>
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={deleteSelected} 
                  title={t("designEditor.actions.delete")} 
                  className="w-full flex items-center justify-center gap-2 py-2 mt-3"
                >
                  <Trash2 className="w-4 h-4" /> 
                  <span>{t("designEditor.actions.deleteElement")}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-200 flex flex-col items-center justify-center overflow-hidden">
          <div className="flex items-center gap-2 mb-3 self-start">
            <Button variant="outline" size="icon" onClick={() => setZoom((prev) => Math.max(0.25, prev - 0.25))}>
              <ZoomOut className="w-4 w-4" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={(val) => setZoom(val[0])}
              min={0.25}
              max={3}
              step={0.01}
              className="w-32"
            />
            <Button variant="outline" size="icon" onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
          </div>

          <div
            ref={canvasContainerRef}
            className="relative bg-gray-100 shadow-lg overflow-hidden w-full h-full max-w-[600px] max-h-[600px]"
            onMouseDown={(e) => handleCanvasMouseDown(e)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div
              ref={designViewportRef}
              style={{
                width: 600,
                height: 600,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              {/* Background removed - blank canvas */}
              <div
                className="absolute border-2 border-dashed border-red-500 pointer-events-none"
                style={{ left: printArea.x, top: printArea.y, width: printArea.width, height: printArea.height }}
              />
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-grab ${selectedElementId === element.id ? "ring-2 ring-blue-500 ring-offset-1" : ""} ${isDraggingCanvasElement && draggedElementId === element.id ? "cursor-grabbing" : ""}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    transform: `rotate(${element.rotation}deg) scaleX(${element.flipX ? -1 : 1}) scaleY(${element.flipY ? -1 : 1})`,
                    opacity: element.opacity,
                    zIndex: selectedElementId === element.id ? 10 : elements.length - elements.indexOf(element),
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleCanvasMouseDown(e, element.id)
                  }}
                >
                  {element.type === "image" && element.src && (
                    <img
                      src={element.src || "/placeholder.svg"}
                      alt="design element"
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                      crossOrigin="anonymous"
                    />
                  )}
                  {element.type === "text" && (
                    <div
                      style={{
                        fontSize: element.fontSize,
                        color: element.color,
                        fontFamily: element.fontFamily,
                        whiteSpace: "pre",
                        display: "inline-block",
                        lineHeight: 1.2,
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  {element.type === "shape" && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: element.shapeType !== "triangle" ? element.fill : undefined,
                        border:
                          element.shapeType !== "triangle"
                            ? `${element.strokeWidth}px solid ${element.stroke}`
                            : undefined,
                        borderRadius: element.shapeType === "circle" ? "50%" : undefined,
                        borderLeft:
                          element.shapeType === "triangle"
                            ? `${(element.width || 0) / 2}px solid transparent`
                            : undefined,
                        borderRight:
                          element.shapeType === "triangle"
                            ? `${(element.width || 0) / 2}px solid transparent`
                            : undefined,
                        borderBottom:
                          element.shapeType === "triangle" ? `${element.height}px solid ${element.fill}` : undefined,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {imageToCrop && (
        <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="my-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={cropAspect}
                minWidth={50}
                minHeight={50}
              >
                <img
                  ref={cropImageRef}
                  src={imageToCrop.src || "/placeholder.svg"}
                  alt="Crop preview"
                  onLoad={onImageLoadForCrop}
                  style={{ maxHeight: "60vh", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
            <canvas ref={cropPreviewCanvasRef} style={{ display: "none" }} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>{t("common.cancel")}</Button>
                <Button onClick={applyCrop} className="bg-red-700 hover:bg-red-800 text-white">
                  {t("designEditor.crop.apply")}
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DesignEditor
