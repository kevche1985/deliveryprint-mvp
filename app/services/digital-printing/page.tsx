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
import { ShoppingCart, Info, FileImage, Calculator, Sparkles, X, Palette } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import DesignServiceEditor from "@/components/design-service-editor" // New import
// Define the DesignOutputData type locally since it's not exported
type DesignOutputData = {
  elements: any[]
  zoom: number
  customizedProductImage?: string
  baseProductImage?: string
  id?: string
}
import QuoteRequestModal from "@/components/quote-request-modal"

const digitalPrintingProducts = [
  {
    id: "foldcote-14",
    name: "FOLDCOTE 14",
    description: "Premium coated paper with excellent print quality and durability",
    sizes: [
      { width: 8.5, height: 11, price_single: 0.75, price_double: 1.25 },
      { width: 11, height: 17, price_single: 1.0, price_double: 1.75 },
      { width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
      { width: 13, height: 19, price_single: 1.5, price_double: 2.5 },
      { width: 18, height: 24, price_single: 3.0, price_double: 5.0 },
    ],
    double_sided_available: true,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//foldcote-14.jpg?height=200&width=300",
  },
  {
    id: "adhesivo",
    name: "ADHESIVO",
    description: "High-quality vinyl stickers with strong adhesive backing",
    sizes: [
      { width: 4, height: 6, price_single: 1.0 },
      { width: 8.5, height: 11, price_single: 1.5 },
      { width: 12, height: 18, price_single: 2.0 },
      { width: 13, height: 19, price_single: 2.5 },
      { width: 18, height: 24, price_single: 4.0 },
      { width: 24, height: 36, price_single: 8.0 },
    ],
    double_sided_available: false,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Adhesivo.png?height=200&width=300",
  },
  {
    id: "couche",
    name: "COUCHE",
    description: "Smooth coated paper perfect for high-quality color printing",
    sizes: [
      { width: 8.5, height: 11, price_single: 0.75, price_double: 1.25 },
      { width: 11, height: 17, price_single: 1.0, price_double: 1.75 },
      { width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
      { width: 13, height: 19, price_single: 1.5, price_double: 2.0 },
      { width: 18, height: 24, price_single: 2.5, price_double: 4.0 },
    ],
    double_sided_available: true,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//COUCHE.jpg?height=200&width=300",
  },
  {
    id: "bond",
    name: "BOND",
    description: "Standard office paper for everyday printing needs",
    sizes: [
      { width: 8.5, height: 11, price_single: 0.5, price_double: 0.8 },
      { width: 11, height: 17, price_single: 1.0, price_double: 1.75 },
      { width: 12, height: 18, price_single: 1.25, price_double: 2.0 },
      { width: 13, height: 19, price_single: 1.5, price_double: 2.5 },
    ],
    double_sided_available: true,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Bond.jpg?height=200&width=300",
  },
  {
    id: "etiqueta-especial",
    name: "ETIQUETA ESPECIAL",
    description: "Premium specialty labels for professional applications",
    sizes: [
      { width: 4, height: 6, price_single: 2.0 },
      { width: 8.5, height: 11, price_single: 2.5 },
      { width: 12, height: 18, price_single: 3.0 },
      { width: 13, height: 19, price_single: 3.5 },
      { width: 18, height: 24, price_single: 5.0 },
    ],
    double_sided_available: false,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Adhesivo.png?height=200&width=300",
  },
  {
    id: "vinyl",
    name: "VINYL BANNER",
    description: "Durable vinyl material perfect for outdoor signage and large format printing",
    sizes: [
      { width: 18, height: 24, price_single: 12.0 },
      { width: 24, height: 36, price_single: 18.0 },
      { width: 36, height: 48, price_single: 28.0 },
      { width: 48, height: 72, price_single: 45.0 },
      { width: 60, height: 96, price_single: 75.0 },
      { width: 72, height: 120, price_single: 120.0 },
    ],
    double_sided_available: false,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//LONNA%20BANNER.jpg?height=200&width=300",
  },
  {
    id: "troquelate",
    name: "TROQUELATE",
    description: "Die-cut specialty material for custom shapes and professional applications",
    sizes: [
      { width: 12, height: 18, price_single: 6.0 },
      { width: 18, height: 24, price_single: 10.0 },
      { width: 24, height: 36, price_single: 18.0 },
      { width: 36, height: 48, price_single: 32.0 },
      { width: 48, height: 60, price_single: 50.0 },
      { width: 60, height: 72, price_single: 75.0 },
    ],
    double_sided_available: false,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//TARJETAS%20TROQUELADAS.jpg?height=200&width=300",
  },
  {
    id: "canvas",
    name: "CANVAS",
    description: "High-quality canvas material ideal for art prints and large format displays",
    sizes: [
      { width: 11, height: 14, price_single: 8.0 },
      { width: 16, height: 20, price_single: 15.0 },
      { width: 18, height: 24, price_single: 20.0 },
      { width: 24, height: 36, price_single: 35.0 },
      { width: 36, height: 48, price_single: 55.0 },
      { width: 48, height: 60, price_single: 85.0 },
      { width: 60, height: 72, price_single: 125.0 },
    ],
    double_sided_available: false,
    image:
      "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//CANVAS.jpg?height=200&width=300",
  },
]

export default function DigitalPrintingPage() {
  const searchParams = useSearchParams()
  const [selectedProduct, setSelectedProduct] = useState(digitalPrintingProducts[0])
  const [selectedSize, setSelectedSize] = useState<{
    width: number
    height: number
    price_single: number
    price_double?: number
  }>(selectedProduct.sizes[0])
  const [printSides, setPrintSides] = useState<"single" | "double">("single")
  const [quantity, setQuantity] = useState(1)
  const [aiDesign, setAiDesign] = useState<any>(null)
  const [showAiDesign, setShowAiDesign] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  // New state for Design Editor
  const [showDesignEditor, setShowDesignEditor] = useState(false)
  const [customDesign, setCustomDesign] = useState<DesignOutputData | null>(null)

  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cartContext = useCart()
  const { addItem } = cartContext || { addItem: () => {} }

  const handleAddToCart = () => {
    if (!cartContext) {
      alert("Cart is not available. Please refresh the page and try again.")
      return
    }


// Determine which design to use (AI design takes priority over custom design)
    const designToUse = aiDesign || customDesign

    // Determine the correct image to use for the cart thumbnail
    let cartImage = selectedProduct.image || "/placeholder.svg?height=200&width=300"
    
    if (aiDesign && aiDesign.previewUrl) {
      // Use AI-generated design image as thumbnail
      cartImage = aiDesign.previewUrl
    } else if (customDesign && customDesign.customizedProductImage) {
      // Use custom design image as thumbnail
      cartImage = customDesign.customizedProductImage
    }

    const cartItem = {
      productId: `digital-print-${selectedProduct.id}`,
      variantId: `${selectedSize.width}x${selectedSize.height}-${printSides}`,
      designId: designToUse?.id || undefined,
      quantity: quantity,
      price: calculatePrice(),
      name: `${selectedProduct.name} - ${selectedSize.width}" × ${selectedSize.height}" (${printSides}-sided)`,
      image: cartImage, // Now uses AI design image when available
      customizations: {
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
        specifications: {
          material: selectedProduct.name,
          dimensions: `${selectedSize.width} × ${selectedSize.height}`,
          sides: printSides,
          doubleSidedAvailable: selectedProduct.double_sided_available,
        },
      },
    }

    addItem(cartItem)
    alert(`Added ${selectedProduct.name} to cart!`)
  }

  const calculatePrice = () => {
    const basePrice =
      printSides === "double" && 'price_double' in selectedSize ? selectedSize.price_double : selectedSize.price_single
    return (basePrice || 0) * quantity
  }

  const handleProductChange = (productId: string) => {
    const product = digitalPrintingProducts.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setSelectedSize(product.sizes[0])
      if (!product.double_sided_available) {
        setPrintSides("single")
      }
      // Clear custom design when product changes
      setCustomDesign(null)
      setShowAiDesign(false) // Also clear AI design if product changes
      setAiDesign(null)
    }
  }

  const handleSizeChange = (sizeIndex: string) => {
    const size = selectedProduct.sizes[Number.parseInt(sizeIndex)]
    if (size) {
      // Handle union type with optional price_double
      setSelectedSize({
        width: size.width,
        height: size.height,
        price_single: size.price_single,
        price_double: 'price_double' in size ? size.price_double : undefined
      })
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

  const handleFiles = (files: FileList) => {
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

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
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
          <h1 className="text-4xl font-bold mb-4">Digital Printing Services</h1>
          <p className="text-xl">High-quality standard format printing for all your business needs</p>
          {(aiDesign || customDesign) && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>{aiDesign ? "AI-Generated Design" : "Custom Design"} Ready for Printing</span>
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
                      Your AI-Generated Design
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
                      <p className="text-sm text-gray-600 capitalize mb-2">{aiDesign.type} • AI Generated</p>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Ready for Printing
                      </Badge>
                    </div>
                  </div>
                  <Alert className="mt-4 border-purple-200 bg-purple-50">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      Your AI-generated design is ready to be printed. Select your preferred material and size below.
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
                      Your Custom Design
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
                        src={customDesign.customizedProductImage || "/placeholder.svg"}
                        alt="Custom Design"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Custom Design for {selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600 capitalize mb-2">Manually Created</p>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Ready for Printing
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

            {/* Material Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Select Material
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {digitalPrintingProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct.id === product.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleProductChange(product.id)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-600">
                              From ${Math.min(...product.sizes.map((s) => s.price_single))}
                            </span>
                            {product.double_sided_available && (
                              <Badge variant="secondary" className="text-xs">
                                Double-sided
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
            <Card>
              <CardHeader>
                <CardTitle>Size & Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="size-select" className="text-sm font-medium mb-2 block">
                    Material Size
                  </Label>
                  <Select
                    value={selectedProduct.sizes.findIndex(size => 
                      size.width === selectedSize.width && 
                      size.height === selectedSize.height && 
                      size.price_single === selectedSize.price_single
                    ).toString()}
                    onValueChange={handleSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.sizes.map((size, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {size.width}" × {size.height}" - ${size.price_single}
                          {'price_double' in size && ` / $${(size as any).price_double} (double)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct.double_sided_available && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Print Sides</Label>
                    <RadioGroup value={printSides} onValueChange={(value: "single" | "double") => setPrintSides(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">Single-sided - ${selectedSize.price_single}</Label>
                      </div>
                      {'price_double' in selectedSize && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="double" id="double" />
                          <Label htmlFor="double">Double-sided - ${selectedSize.price_double}</Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium mb-2 block">
                    Quantity
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
              </CardContent>
            </Card>

            {/* File Upload / Design Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Upload or Create Your Design</CardTitle>
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
                      <h3 className="text-lg font-medium mb-2">Drop your files here</h3>
                      <p className="text-gray-600 mb-4">Support: PDF, PNG, JPG, AI, PSD, ZIP (Max 50MB)</p>
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Choose Files
                      </Button>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <h4 className="font-medium text-left">Uploaded Files:</h4>
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
                      <p className="text-gray-600 mb-4">Or create a custom design:</p>
                      <Button
                        onClick={() => setShowDesignEditor(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Palette className="mr-2 h-5 w-5" />
                        Customize Design
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded border bg-white flex items-center justify-center overflow-hidden">
                        {(customDesign?.customizedProductImage || aiDesign?.previewUrl) ? (
                          <img
                            src={customDesign?.customizedProductImage || aiDesign?.previewUrl}
                            alt="Current Design"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load, using placeholder')
                              e.currentTarget.src = '/placeholder.svg'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Palette className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Design Loaded</p>
                        <p className="text-sm text-gray-600">
                          {customDesign ? "Your custom design" : "AI-generated design"} is ready.
                        </p>
                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-400 mt-1 space-y-1">
                            <p>Image: {customDesign?.customizedProductImage ? 'Custom' : aiDesign?.previewUrl ? 'AI' : 'None'}</p>
                            <p>Custom Image URL: {customDesign?.customizedProductImage ? 'Available' : 'Missing'}</p>
                            <p>AI Preview URL: {aiDesign?.previewUrl ? 'Available' : 'Missing'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowDesignEditor(true)}>
                      Edit Design
                    </Button>
                  </div>
                )}
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">Design Guidelines:</p>
                      <ul className="text-red-700 mt-1 space-y-1">
                        <li>• Minimum 300 DPI resolution</li>
                        <li>• Include 0.125" bleed for full-coverage designs</li>
                        <li>• CMYK color mode preferred</li>
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
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>
                        {selectedSize.width}" × {selectedSize.height}"
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Print:</span>
                      <span className="capitalize">{printSides}-sided</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{quantity}</span>
                    </div>
                    {(aiDesign || customDesign) && (
                  <div className="flex justify-between">
                    <span>Design:</span>
                    <span className="text-purple-600 flex items-center gap-1">
                      {aiDesign ? "AI Generated" : "Custom"}
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        ✓ Ready
                      </Badge>
                    </span>
                  </div>
                )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>
                        $
                        {printSides === "double" && 'price_double' in selectedSize
                          ? (selectedSize.price_double || selectedSize.price_single).toFixed(2)
                          : selectedSize.price_single.toFixed(2)}
                      </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-red-600">${calculatePrice().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pb-4">
                  <Button onClick={handleAddToCart} className="w-full bg-red-600 hover:bg-red-700" size="lg">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>

                  <div className="text-center">
                    <Button
                      onClick={() => setShowQuoteModal(true)}
                      variant="outline"
                      className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                      Request Custom Quote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Production Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Turnaround:</span>
                  <span className="font-medium">1-2 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="font-medium">Same day</span>
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
            productImage={selectedProduct.image || ''}
            productName={selectedProduct.name}
            initialDesign={
              customDesign
                ? {
                    elements: customDesign.elements,
                    zoom: customDesign.zoom,
                    productImage: customDesign.baseProductImage || selectedProduct.image || '',
                  }
                : undefined
            }
          />
      )}
      {showQuoteModal && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          serviceType="Digital Printing"
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
    </div>
  )
}
