"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, Info, FileImage, Calculator, Sparkles, X, Palette, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import DesignServiceEditor from "@/components/design-service-editor" // New import
import { useLanguage } from "@/lib/language-context"
// Define the DesignOutputData type locally since it's not exported
type DesignOutputData = {
  elements: any[]
  zoom: number
  customizedProductImage?: string
  baseProductImage?: string
  id?: string
}
import QuoteRequestModal from "@/components/quote-request-modal"
import FastTrackCheckoutModal from "@/components/fast-track-checkout-modal"

type DigitalPrintingSize = {
  label?: string
  width: number
  height: number
  price_single: number
  price_double?: number
}

type DigitalPrintingProduct = {
  id: string
  name: string
  description: string
  sizes: DigitalPrintingSize[]
  double_sided_available: boolean
  image: string
}

const digitalPrintingProducts: DigitalPrintingProduct[] = [
  {
    id: "couche-100",
    name: "COUCHE 100",
    description: "Smooth coated paper perfect for high-quality color printing",
    sizes: [
      { width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
      { width: 13, height: 19, price_single: 1.5, price_double: 2.0 },
    ],
    double_sided_available: true,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/COUCHE.jpg",
  },
  {
    id: "foldcote-12",
    name: "FOLDCOTE 12",
    description: "Premium coated paper with excellent print quality and durability",
    sizes: [
      { width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
      { width: 13, height: 19, price_single: 1.5, price_double: 2.5 },
    ],
    double_sided_available: true,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/Folcote_2.jpg",
  },
  {
    id: "bond",
    name: "BOND",
    description: "Standard office paper for everyday printing needs",
    sizes: [
      { label: "Tamaño Carta", width: 8.5, height: 11, price_single: 0.5, price_double: 0.8 },
      { label: "A4", width: 8.27, height: 11.69, price_single: 0.5, price_double: 0.8 },
      { label: "12x18”", width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
    ],
    double_sided_available: true,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/PAPEL%20BOND.jpg",
  },
  {
    id: "adhesivo",
    name: "ADHESIVO",
    description: "High-quality vinyl stickers with strong adhesive backing",
    sizes: [
      { width: 12, height: 18, price_single: 2.0 },
      { width: 13, height: 19, price_single: 2.5 },
    ],
    double_sided_available: false,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/ADHESIVO.jpg",
  },
]

export default function DigitalPrintingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<DigitalPrintingProduct | null>(null)
  const [selectedSize, setSelectedSize] = useState<DigitalPrintingSize | null>(null)
  const [printSides, setPrintSides] = useState<"single" | "double" | null>(null)
  const [colorMode, setColorMode] = useState<"bw" | "color" | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [quantity, setQuantity] = useState(1)
  const [aiDesign, setAiDesign] = useState<any>(null)
  const [showAiDesign, setShowAiDesign] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showFastCheckout, setShowFastCheckout] = useState(false)

  // New state for Design Editor
  const [showDesignEditor, setShowDesignEditor] = useState(false)
  const [customDesign, setCustomDesign] = useState<DesignOutputData | null>(null)

  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedLinks, setUploadedLinks] = useState<
    Array<{ uploaded_file_id: string; file_url: string; file_name: string; original_filename: string }>
  >([])
  const [uploadingDesigns, setUploadingDesigns] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cartContext = useCart()
  const { addItem } = cartContext || { addItem: () => {} }
  const { user } = useAuth()
  const { t } = useLanguage()
  const materialRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const sidesRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)

  const uploadDesignFiles = async (files: File[]) => {
    const results: Array<{ uploaded_file_id: string; file_url: string; file_name: string; original_filename: string }> = []
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token || null

    for (const f of files) {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch("/api/uploads/design", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || "Design upload failed")
      }
      const data = await res.json().catch(() => ({}))
      if (!data?.uploadedFile?.id || !data?.uploadedFile?.file_url) {
        throw new Error("Design upload returned an invalid response")
      }
      results.push({
        uploaded_file_id: data.uploadedFile.id,
        file_url: data.uploadedFile.file_url,
        file_name: data.uploadedFile.file_name || f.name,
        original_filename: data.uploadedFile.original_filename || f.name,
      })
    }

    return results
  }

  const handleAddToCart = async () => {
    if (!cartContext) {
      alert("Cart is not available. Please refresh the page and try again.")
      return
    }


// Determine which design to use (AI design takes priority over custom design)
    const designToUse = aiDesign || customDesign

    if (!selectedProduct || !selectedSize || !printSides || !colorMode) {
      toast({ title: t("common.toast.error"), description: t("common.toast.completeSteps"), variant: "destructive" })
      return
    }

    let finalUploadedLinks = uploadedLinks
    if (uploadedFiles.length > 0 && finalUploadedLinks.length === 0) {
      setUploadingDesigns(true)
      try {
        finalUploadedLinks = await uploadDesignFiles(uploadedFiles)
        setUploadedLinks(finalUploadedLinks)
      } catch (e: any) {
      toast({
          title: t("common.toast.error"),
          description: e?.message || "Failed to upload design file",
          variant: "destructive",
        })
        return
      } finally {
        setUploadingDesigns(false)
      }
    }
    let cartImage = selectedProduct.image || "/placeholder.svg?height=200&width=300"
    if (aiDesign && aiDesign.previewUrl) {
      cartImage = aiDesign.previewUrl
    } else if (customDesign) {
      const cd: any = customDesign
      cartImage =
        cd.customizedProductImage ||
        cd.thumbnail_jpeg ||
        cd.preview_url ||
        cd.download_url ||
        cd.storage_url ||
        cartImage
    }

    const sidesLabel = printSides === "double"
      ? t("services.digitalPrintingPage.doubleSided")
      : t("services.digitalPrintingPage.singleSided")
    const colorLabel = colorMode === "bw" ? t("services.digitalPrintingPage.color.bw") : t("services.digitalPrintingPage.color.full")

    const localizedProductName = t(`services.digitalPrintingPage.products.${selectedProduct.id}.name`)
    const sizeLabel = selectedSize.label
      ? `${selectedSize.label} (${selectedSize.width}" × ${selectedSize.height}")`
      : `${selectedSize.width}" × ${selectedSize.height}"`

    const fallbackDesignUrl =
      finalUploadedLinks?.[0]?.file_url ||
      (customDesign as any)?.download_url ||
      (customDesign as any)?.storage_url ||
      (customDesign as any)?.customizedProductImage ||
      (aiDesign as any)?.download_url ||
      (aiDesign as any)?.previewUrl ||
      null

    const cartItem = {
      productId: `digital-print-${selectedProduct.id}`,
      variantId: `${selectedSize.width}x${selectedSize.height}-${printSides}`,
      designId: designToUse?.id || undefined,
      quantity: quantity,
      price: calculatePrice(),
      name: `${localizedProductName} - ${sizeLabel} (${sidesLabel}, ${colorLabel})`,
      image: cartImage, // Now uses AI design image when available
      customizations: {
        material_type: selectedProduct.name,
        product: selectedProduct,
        size: selectedSize,
        printSides: printSides,
        quantity: quantity,
        aiDesign: aiDesign,
        customDesign: customDesign
          ? {
              elements: customDesign.elements,
              zoom: customDesign.zoom,
              customizedProductImage: customDesign.customizedProductImage,
              baseProductImage: customDesign.baseProductImage,
            }
          : undefined,
        uploadedFiles: finalUploadedLinks,
        uploaded_file_id: finalUploadedLinks?.[0]?.uploaded_file_id || null,
        design_file_url: fallbackDesignUrl,
        specifications: {
          material: localizedProductName,
          dimensions: `${selectedSize.width} × ${selectedSize.height}`,
          sides: printSides,
          color: colorMode,
          doubleSidedAvailable: selectedProduct.double_sided_available,
        },
      },
    }

    addItem(cartItem)
    toast({
      title: t("common.toast.addedToCartTitle"),
      description: `${localizedProductName} ${t("common.toast.addedToCartDescSuffix")}`,
    })
  }

  const handleFastCheckout = async () => {
    await handleAddToCart()
    router.push("/checkout")
  }

  function calculatePrice() {
    if (!selectedSize || !printSides || !colorMode) return 0
    const basePrice = printSides === "double" && 'price_double' in selectedSize ? (selectedSize as any).price_double : selectedSize.price_single
    const colorMultiplier = colorMode === "bw" ? 0.9 : 1
    return ((basePrice || 0) * colorMultiplier) * quantity
  }

  const handleProductChange = (productId: string) => {
    const product = digitalPrintingProducts.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setSelectedSize(product.sizes[0])
      setPrintSides(null)
      setColorMode(null)
      setCurrentStep(2)
      sizeRef.current?.scrollIntoView({ behavior: "smooth" })
      // Don't clear designs when material changes - preserve user's design choice
      // setCustomDesign(null) - Commented out to preserve custom designs
      // setShowAiDesign(false) - Commented out to preserve AI designs
      // setAiDesign(null) - Commented out to preserve AI designs
    }
  }

  const handleSizeChange = (sizeIndex: string) => {
    if (!selectedProduct) return
    const size = selectedProduct.sizes[Number.parseInt(sizeIndex)]
    if (size) {
      // Handle union type with optional price_double
      setSelectedSize({
        width: size.width,
        height: size.height,
        price_single: size.price_single,
        price_double: 'price_double' in size ? size.price_double : undefined
      })
      setCurrentStep(3)
      sidesRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleRemoveAiDesign = () => {
    setAiDesign(null)
    setShowAiDesign(false)
  }

  const handleRemoveCustomDesign = () => {
    setCustomDesign(null)
    sessionStorage.removeItem("pendingDesignForService")
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/zip",
        "application/x-zip-compressed",
      ]
      const validExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".ai", ".psd", ".zip"]
      return validTypes.includes(file.type) || validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    })

    if (validFiles.length === 0) return
    setUploadedFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setUploadedLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // Check for AI-generated design or manually created design
  useEffect(() => {
    const designParam = searchParams.get("design")
    if (designParam === "ai-generated") {
      const storedDesign = sessionStorage.getItem("pendingDesignForPrint")
      if (storedDesign) {
        try {
          const designData = JSON.parse(storedDesign)
          setAiDesign(designData)
          setShowAiDesign(true)
          setCustomDesign(null) // Ensure custom design is cleared if AI design is loaded
          sessionStorage.removeItem("pendingDesignForPrint")
        } catch (error) {
          console.error("Error parsing stored AI design:", error)
        }
      }
    } else {
      // Check for manually created design
      const storedCustomDesign = sessionStorage.getItem("pendingDesignForService")
      if (storedCustomDesign) {
        try {
          const designData = JSON.parse(storedCustomDesign) as DesignOutputData
          console.log('Loaded custom design from sessionStorage:', designData)
          setCustomDesign(designData)
          setAiDesign(null) // Ensure AI design is cleared if custom design is loaded
          setShowAiDesign(false)
          // Do NOT remove from sessionStorage here, as it might be needed for re-editing
          // It will be removed when a new design is saved or explicitly removed.
        } catch (error) {
          console.error("Error parsing stored custom design:", error)
        }
      }
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">{t("services.digitalPrintingPage.headerTitle")}</h1>
          <p className="text-xl">{t("services.digitalPrintingPage.headerSubtitle")}</p>
          {(aiDesign || customDesign) && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>
                  {aiDesign ? t("services.digitalPrintingPage.aiGeneratedLabel") : t("services.digitalPrintingPage.customDesignLabel")} {t("services.digitalPrintingPage.readyForPrinting")}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Design Preview */}
            {showAiDesign && aiDesign && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      {t("services.digitalPrintingPage.yourAIGeneratedDesign")}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveAiDesign}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border-2 border-purple-200">
                      <img
                        src={aiDesign.previewUrl || "/placeholder.svg"}
                        alt={aiDesign.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{aiDesign.name}</h3>
                      <p className="text-sm text-gray-600 capitalize mb-2">{aiDesign.type} • {t("services.digitalPrintingPage.aiGenerated")}</p>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {t("services.digitalPrintingPage.readyForPrinting")}
                      </Badge>
                    </div>
                  </div>
                  <Alert className="mt-4 border-purple-200 bg-purple-50">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      {t("services.digitalPrintingPage.readyForPrinting")}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Custom Design Preview */}
            {customDesign && !showAiDesign && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-red-600" />
                      {t("services.digitalPrintingPage.yourCustomDesign")}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveCustomDesign}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border-2 border-red-200">
                      <img
                        src={
                          (customDesign as any)?.thumbnail_jpeg ||
                          (customDesign as any)?.customizedProductImage ||
                          (customDesign as any)?.preview_url ||
                          (customDesign as any)?.download_url ||
                          (customDesign as any)?.storage_url ||
                          (customDesign as any)?.baseProductImage ||
                          "/placeholder.svg"
                        }
                        alt="Custom Design"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const cd: any = customDesign
                          if (!(e.currentTarget as any).dataset.fallbackApplied) {
                            (e.currentTarget as any).dataset.fallbackApplied = "1"
                            e.currentTarget.src =
                              cd?.thumbnail_jpeg ||
                              cd?.customizedProductImage ||
                              cd?.preview_url ||
                              cd?.download_url ||
                              cd?.storage_url ||
                              cd?.baseProductImage ||
                              "/placeholder.svg"
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {t("services.digitalPrintingPage.customDesignLabel")}
                            {selectedProduct ? ` for ${t(`services.digitalPrintingPage.products.${selectedProduct.id}.name`)}` : ""}
                          </h3>
                      <p className="text-sm text-gray-600 capitalize mb-2">{t("services.digitalPrintingPage.manuallyCreated")}</p>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {t("services.digitalPrintingPage.readyForPrinting")}
                      </Badge>
                    </div>
                  </div>
                  <Alert className="mt-4 border-red-200 bg-red-50">
                    <Info className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Your custom design is ready to be printed. Select your preferred material and size below.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Stepper */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Follow these steps to make your first print</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="cursor-pointer" variant={currentStep === 1 ? "default" : "outline"} onClick={() => { setCurrentStep(1); materialRef.current?.scrollIntoView({ behavior: "smooth" }) }}>1 {t("services.digitalPrintingPage.steps.material")}</Badge>
                <span>›</span>
                <Badge className="cursor-pointer" variant={currentStep === 2 ? "default" : "outline"} onClick={() => { setCurrentStep(2); sizeRef.current?.scrollIntoView({ behavior: "smooth" }) }}>2 {t("services.digitalPrintingPage.steps.size")}</Badge>
                <span>›</span>
                <Badge className="cursor-pointer" variant={currentStep === 3 ? "default" : "outline"} onClick={() => { setCurrentStep(3); sidesRef.current?.scrollIntoView({ behavior: "smooth" }) }}>3 {t("services.digitalPrintingPage.steps.sides")}</Badge>
                <span>›</span>
                <Badge className="cursor-pointer" variant={currentStep === 4 ? "default" : "outline"} onClick={() => { setCurrentStep(4); colorRef.current?.scrollIntoView({ behavior: "smooth" }) }}>4 {t("services.digitalPrintingPage.steps.color")}</Badge>
              </div>
            </div>

            {/* Material Selection */}
            <Card ref={materialRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {`${t("common.step")} 1 - ${t("services.digitalPrintingPage.selectMaterial")}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {digitalPrintingProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct?.id === product.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleProductChange(product.id)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={t(`services.digitalPrintingPage.products.${product.id}.name`)}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{t(`services.digitalPrintingPage.products.${product.id}.name`)}</h3>
                          <p className="text-sm text-gray-600 mb-2">{t(`services.digitalPrintingPage.products.${product.id}.description`)}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-600">
                              {t("common.from")} ${Math.min(...product.sizes.map((s) => s.price_single))}
                            </span>
                            {product.double_sided_available && (
                              <Badge variant="secondary" className="text-xs">
                                {t("services.digitalPrintingPage.doubleSided")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Size Selection */}
            <Card ref={sizeRef}>
              <CardHeader>
                <CardTitle>{`${t("common.step")} 2 - ${t("services.digitalPrintingPage.sizeOptionsTitle")}`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="size-select" className="text-sm font-medium mb-2 block">
                    {t("services.digitalPrintingPage.materialSize")}
                  </Label>
                  <Select
                    disabled={!selectedProduct}
                    value={selectedProduct && selectedSize ? selectedProduct.sizes.findIndex(size => 
                      size.width === selectedSize.width && 
                      size.height === selectedSize.height && 
                      size.price_single === selectedSize.price_single
                    ).toString() : undefined}
                    onValueChange={handleSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedProduct || { sizes: [] }).sizes.map((size, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {size.label ? `${size.label} (${size.width}" × ${size.height}")` : `${size.width}" × ${size.height}"`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct?.double_sided_available && (
                  <div ref={sidesRef}>
                    <Label className="text-sm font-medium mb-3 block">{`${t("common.step")} 3 - ${t("services.digitalPrintingPage.printSides")}`}</Label>
                    <RadioGroup value={printSides || undefined} onValueChange={(value: "single" | "double") => { setPrintSides(value); setCurrentStep(4); colorRef.current?.scrollIntoView({ behavior: "smooth" }) }}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" disabled={!selectedProduct || !selectedSize} />
                        <Label htmlFor="single">{t("services.digitalPrintingPage.singleSided")}</Label>
                      </div>
                      {selectedSize && 'price_double' in selectedSize && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="double" id="double" disabled={!selectedProduct || !selectedSize} />
                          <Label htmlFor="double">{t("services.digitalPrintingPage.doubleSided")}</Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                {/* Color selection */}
                <div className="mt-4" ref={colorRef}>
                  <Label className="text-sm font-medium mb-3 block">{`${t("common.step")} 4 - ${t("services.digitalPrintingPage.color.title")}`}</Label>
                  <RadioGroup value={colorMode || undefined} onValueChange={(v: "bw" | "color") => setColorMode(v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bw" id="bw" disabled={!selectedProduct} />
                      <Label htmlFor="bw">{t("services.digitalPrintingPage.color.bw")} (-10%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="color" id="color" disabled={!selectedProduct} />
                      <Label htmlFor="color">{t("services.digitalPrintingPage.color.full")}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium mb-2 block">
                      {t("services.digitalPrintingPage.quantity")}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="w-32"
                    />
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium mb-2">Estimación</div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Unitario</span>
                      <span>
                        {selectedSize && printSides && colorMode
                          ? `$${(((printSides === "double" && 'price_double' in selectedSize)
                                ? ((selectedSize as any).price_double || selectedSize.price_single)
                                : selectedSize.price_single) * (colorMode === "bw" ? 0.9 : 1)).toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{selectedSize && printSides && colorMode ? `$${calculatePrice().toFixed(2)}` : "-"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload / Design Editor */}
            <Card>
              <CardHeader>
                <CardTitle>{t("services.digitalPrintingPage.uploadCreateTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.ai,.psd,.zip"
                  onChange={handleFileInput}
                  className="hidden"
                />
                {!customDesign && !showAiDesign ? (
                  <>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-red-400"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t("services.digitalPrintingPage.dropFilesHere")}</h3>
                      <p className="text-gray-600 mb-4">{t("services.digitalPrintingPage.supportFormatsShort")}</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        {t("services.digitalPrintingPage.chooseFiles")}
                      </Button>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <h4 className="font-medium text-left">{t("services.digitalPrintingPage.uploadedFilesLabel")}</h4>
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-left"
                            >
                              <span className="text-sm truncate">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Separator className="my-6" />
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">{t("services.digitalPrintingPage.orCreateCustomDesign")}</p>
                      <Button
                        onClick={() => {
                          console.log("🎨 Design editor button clicked", {
                            hasUser: !!user,
                            userEmail: user?.email,
                            userObject: user
                          })
                          
                          if (!user?.email) {
                            toast({
                              title: t("common.loginRequired.title"),
                              description: t("common.loginRequired.description"),
                              variant: "destructive",
                            })
                          }
                          setShowDesignEditor(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Palette className="mr-2 h-5 w-5" />
                        {t("services.digitalPrintingPage.customizeDesign")}
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Show compact design info when design exists */
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border-2">
                        <img
                          src={customDesign?.customizedProductImage || aiDesign?.previewUrl || "/placeholder.svg"}
                          alt="Current Design"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {aiDesign ? aiDesign.name : t("services.digitalPrintingPage.customDesignLabel")}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {aiDesign ? t("services.digitalPrintingPage.aiGenerated") : t("services.digitalPrintingPage.customUpload")} • {t("services.digitalPrintingPage.readyForPrinting")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {t("services.digitalPrintingPage.replace")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!user?.email) {
                              toast({
                                title: t("common.loginRequired.title"),
                                description: t("common.loginRequired.description"),
                                variant: "destructive",
                              })
                              return
                            }
                            setShowDesignEditor(true)
                          }}
                        >
                          <Palette className="mr-2 h-4 w-4" />
                          {t("services.digitalPrintingPage.edit")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Debug section - can be removed in production */}
                {(customDesign || aiDesign) && (
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded border bg-white flex items-center justify-center overflow-hidden">
                        {(() => {
                          // Try multiple possible image URL properties
                           const customDesignAny = customDesign as any
                           const imageUrl = customDesignAny?.thumbnail_jpeg ||
                                            customDesign?.customizedProductImage || 
                                            customDesignAny?.preview_url || 
                                            customDesignAny?.download_url ||
                                            customDesignAny?.baseProductImage ||
                                            aiDesign?.previewUrl
                           
                           console.log('🖼️ Thumbnail debug:', {
                             hasCustomDesign: !!customDesign,
                             hasAiDesign: !!aiDesign,
                             customizedProductImage: customDesign?.customizedProductImage?.substring(0, 100) + '...',
                             preview_url: customDesignAny?.preview_url?.substring(0, 100) + '...',
                             download_url: customDesignAny?.download_url?.substring(0, 100) + '...',
                             aiPreviewUrl: aiDesign?.previewUrl,
                             finalImageUrl: imageUrl?.substring(0, 100) + '...',
                             imageUrlType: imageUrl?.startsWith('data:') ? 'base64' : imageUrl?.startsWith('http') ? 'url' : 'unknown',
                             imageUrlLength: imageUrl?.length
                           })
                          
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Current Design"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('❌ Image failed to load:', {
                                  url: imageUrl,
                                  urlType: imageUrl?.startsWith('data:') ? 'base64' : imageUrl?.startsWith('http') ? 'url' : 'unknown',
                                  urlLength: imageUrl?.length,
                                  error: e
                                })
                                e.currentTarget.src = '/placeholder.svg'
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', {
                                  url: imageUrl?.substring(0, 100) + '...',
                                  urlType: imageUrl?.startsWith('data:') ? 'base64' : imageUrl?.startsWith('http') ? 'url' : 'unknown'
                                })
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Palette className="w-6 h-6 text-gray-400" />
                            </div>
                          )
                        })()}
                      </div>
                      <div>
                        <p className="font-medium">{t("services.digitalPrintingPage.designLoaded")}</p>
                        <p className="text-sm text-gray-600">
                          {customDesign ? t("services.digitalPrintingPage.designReady") : `${t("services.digitalPrintingPage.aiGenerated")} ${t("common.ready")}.`}
                        </p>
                        {/* Enhanced debug info */}
                         {process.env.NODE_ENV === 'development' && (() => {
                           const customDesignAny = customDesign as any
                           return (
                             <div className="text-xs text-gray-400 mt-1 space-y-1">
                               <p>Type: {customDesign ? 'Custom' : aiDesign ? 'AI' : 'None'}</p>
                               <p>customizedProductImage: {customDesign?.customizedProductImage ? '✅' : '❌'}</p>
                               <p>preview_url: {customDesignAny?.preview_url ? '✅' : '❌'}</p>
                               <p>download_url: {customDesignAny?.download_url ? '✅' : '❌'}</p>
                               <p>AI previewUrl: {aiDesign?.previewUrl ? '✅' : '❌'}</p>
                               <p>Design ID: {customDesignAny?.design_id || 'None'}</p>
                               <p>Saved at: {customDesignAny?.saved_at || 'Unknown'}</p>
                             </div>
                           )
                         })()}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowDesignEditor(true)}>
                      {t("services.digitalPrintingPage.editDesign")}
                    </Button>
                  </div>
                )}
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">{t("services.digitalPrintingPage.designGuidelinesTitle")}</p>
                      <ul className="text-red-700 mt-1 space-y-1">
                        <li>{t("services.digitalPrintingPage.guidelines.bullet1")}</li>
                        <li>{t("services.digitalPrintingPage.guidelines.bullet2")}</li>
                        <li>{t("services.digitalPrintingPage.guidelines.bullet3")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t("services.digitalPrintingPage.orderSummaryTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                          <span className="font-medium">{selectedProduct ? t(`services.digitalPrintingPage.products.${selectedProduct.id}.name`) : t("services.digitalPrintingPage.steps.material")}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>{t("common.labels.size")}</span>
                      <span>
                        {selectedSize
                          ? selectedSize.label
                            ? `${selectedSize.label} (${selectedSize.width}" × ${selectedSize.height}")`
                            : `${selectedSize.width}" × ${selectedSize.height}"`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("common.labels.print")}</span>
                          <span className="capitalize">{printSides ? (printSides === "double" ? t("services.digitalPrintingPage.doubleSided") : t("services.digitalPrintingPage.singleSided")) : "-"}</span>
                    </div>
                      <div className="flex justify-between">
                        <span>{t("common.labels.color")}</span>
                        <span>{colorMode ? (colorMode === "bw" ? t("services.digitalPrintingPage.color.bw") : t("services.digitalPrintingPage.color.full")) : "-"}</span>
                      </div>
                    <div className="flex justify-between">
                      <span>{t("common.labels.quantity")}</span>
                      <span>{quantity}</span>
                    </div>
                    {(aiDesign || customDesign) && (
                  <div className="flex justify-between">
                    <span>{t("common.labels.design")}</span>
                    <span className="text-purple-600 flex items-center gap-1">
                      {aiDesign ? t("services.digitalPrintingPage.aiGenerated") : t("services.digitalPrintingPage.customDesignLabel")}
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        ✓ {t("common.ready")}
                      </Badge>
                    </span>
                  </div>
                )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("common.labels.unitPrice")}</span>
                    <span>
                        {selectedSize ? (
                          printSides === "double" && 'price_double' in selectedSize
                            ? `$${((selectedSize as any).price_double || selectedSize.price_single).toFixed(2)}`
                            : `$${selectedSize.price_single.toFixed(2)}`
                        ) : "-$"}
                      </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("common.labels.total")}</span>
                    <span className="text-red-600">${calculatePrice().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pb-4">
                  <Button
                    onClick={() => setShowFastCheckout(true)}
                    className="w-full bg-gray-900 hover:bg-gray-800"
                    size="lg"
                    disabled={uploadingDesigns}
                  >
                    {t("common.checkout")}
                  </Button>

                  <Button
                    onClick={() => void handleAddToCart()}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                    disabled={uploadingDesigns}
                  >
                    {uploadingDesigns ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                    {uploadingDesigns ? "Uploading design..." : t("common.addToCart")}
                  </Button>

                  <div className="text-center">
                    <Button
                      onClick={() => setShowQuoteModal(true)}
                      variant="outline"
                      className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                      {t("services.digitalPrintingPage.requestCustomQuote")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("services.digitalPrintingPage.productionInfo.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("services.digitalPrintingPage.productionInfo.turnaroundLabel")}</span>
                  <span className="font-medium">{t("services.digitalPrintingPage.productionInfo.turnaroundValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("services.digitalPrintingPage.productionInfo.shippingLabel")}</span>
                  <span className="font-medium">{t("services.digitalPrintingPage.productionInfo.shippingValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("services.digitalPrintingPage.productionInfo.pickupLabel")}</span>
                  <span className="font-medium">{t("services.digitalPrintingPage.productionInfo.pickupValue")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showDesignEditor && (
          <DesignServiceEditor
            isOpen={showDesignEditor}
            onClose={() => setShowDesignEditor(false)}
            onSave={(designData: any) => {
              setCustomDesign(designData)
              setShowDesignEditor(false)
            }}
            productImage={selectedProduct?.image || ''}
            productName={selectedProduct ? t(`services.digitalPrintingPage.products.${selectedProduct.id}.name`) : ''}
            product={selectedProduct as any}
            variants={selectedProduct?.sizes || []}
            selectedVariant={selectedProduct && selectedSize ? selectedProduct.sizes?.findIndex(size => 
              size.width === selectedSize.width && 
              size.height === selectedSize.height && 
              size.price_single === selectedSize.price_single
            )?.toString() : '0'}
            initialDesign={
              customDesign
                ? {
                    elements: customDesign.elements,
                    zoom: customDesign.zoom,
                    productImage: customDesign.baseProductImage || selectedProduct?.image || '',
                  }
                : undefined
            }
          />
      )}
      {showQuoteModal && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          serviceType={t("services.digitalPrintingPage.headerTitle")}
          prefilledData={{
            product: selectedProduct,
            size: selectedSize,
            printSides: printSides,
            quantity: quantity,
            customDesign: customDesign,
            aiDesign: aiDesign,
          }}
        />
      )}

      <FastTrackCheckoutModal
        isOpen={showFastCheckout}
        onClose={() => setShowFastCheckout(false)}
        title={t("common.checkout")}
        description={t("common.fastCheckoutDescription")}
        proceedLabel={t("common.checkout")}
        cancelLabel={t("common.cancel")}
        disabled={uploadingDesigns}
        summary={[
          {
            label: t("common.labels.material"),
            value: selectedProduct ? t(`services.digitalPrintingPage.products.${selectedProduct.id}.name`) : "-",
          },
          { label: t("common.labels.quantity"), value: String(quantity) },
          { label: t("common.labels.total"), value: `$${calculatePrice().toFixed(2)}` },
        ]}
        onProceed={async () => {
          await handleFastCheckout()
          setShowFastCheckout(false)
        }}
      />
    </div>
  )
}
