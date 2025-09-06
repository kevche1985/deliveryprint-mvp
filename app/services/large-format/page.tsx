"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Ruler, FileImage, Calculator, Info, Palette, X } from "lucide-react"
import DesignServiceEditor from "@/components/design-service-editor" // New import
import type { DesignOutputData } from "@/components/design-editor" // New import
import { useCart } from "@/lib/cart-context"
import QuoteRequestModal from "@/components/quote-request-modal"

const largeFormatProducts = [
  {
    id: "banner",
    name: "BANNER",
    description: "Durable vinyl banners perfect for outdoor advertising and events",
    baseSize: { width: 1, height: 1, unit: "MTS" },
    price: 7.0,
    priceUnit: "per sq meter",
    customSize: true,
    weatherResistant: true,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Banner.png?height=200&width=300",
  },
  {
    id: "troquelados",
    name: "TROQUELADOS",
    description: "Precision die-cut shapes and custom cutouts",
    baseSize: { width: 12, height: 18, unit: "inches" },
    price: 2.0,
    priceUnit: "per piece",
    customSize: false,
    weatherResistant: false,
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//TARJETAS%20TROQUELADAS.jpg?height=200&width=300",
  },
]

export default function LargeFormatPage() {
  const [selectedProduct, setSelectedProduct] = useState(largeFormatProducts[0])
  const [customWidth, setCustomWidth] = useState(selectedProduct.baseSize.width)
  const [customHeight, setCustomHeight] = useState(selectedProduct.baseSize.height)
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState("")

  // New state for Design Editor
  const [showDesignEditor, setShowDesignEditor] = useState(false)
  const [customDesign, setCustomDesign] = useState<DesignOutputData | null>(null)
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  const { addItem } = useCart()

  const handleAddToCart = () => {
    const cartItem = {
      productId: `large-format-${selectedProduct.id}`,
      variantId: `${selectedProduct.id}-${customWidth}x${customHeight}`,
      designId: customDesign?.id || undefined,
      quantity: quantity,
      price: calculatePrice(),
      name: `${selectedProduct.name} - ${customWidth}x${customHeight} ${selectedProduct.baseSize.unit}`,
      image: customDesign?.customizedProductImage || selectedProduct.image || "/placeholder.svg?height=200&width=300",
      customizations: {
        product: selectedProduct,
        width: customWidth,
        height: customHeight,
        quantity: quantity,
        specialInstructions: specialInstructions,
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
          dimensions: `${customWidth} × ${customHeight} ${selectedProduct.baseSize.unit}`,
          area: calculateArea(),
        },
      },
    }

    addItem(cartItem)
    alert(`Added ${selectedProduct.name} to cart!`)
  }

  const calculatePrice = () => {
    if (selectedProduct.id === "banner") {
      const area = customWidth * customHeight
      return area * selectedProduct.price * quantity
    } else {
      return selectedProduct.price * quantity
    }
  }

  const calculateArea = () => {
    if (selectedProduct.id === "banner") {
      return customWidth * customHeight
    }
    return null
  }

  const handleRemoveCustomDesign = () => {
    setCustomDesign(null)
    sessionStorage.removeItem("pendingDesignForService")
  }

  useEffect(() => {
    const storedCustomDesign = sessionStorage.getItem("pendingDesignForService")
    if (storedCustomDesign) {
      try {
        const designData = JSON.parse(storedCustomDesign) as DesignOutputData
        setCustomDesign(designData)
      } catch (error) {
        console.error("Error parsing stored custom design:", error)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Large Format Printing</h1>
          <p className="text-xl">Professional banners, posters, and specialty large-scale printing</p>
          {customDesign && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <span>Custom Design Ready for Printing</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Custom Design Preview */}
            {customDesign && (
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
                </CardContent>
              </Card>
            )}

            {/* Product Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Select Product Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {largeFormatProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct.id === product.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedProduct(product)
                        setCustomWidth(product.baseSize.width)
                        setCustomHeight(product.baseSize.height)
                        setCustomDesign(null) // Clear custom design when product changes
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            {product.weatherResistant && (
                              <Badge variant="secondary" className="text-xs">
                                Weather Resistant
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-red-600">
                              ${product.price.toFixed(2)} {product.priceUnit}
                            </span>
                            <span className="text-xs text-gray-500">
                              Base: {product.baseSize.width} × {product.baseSize.height} {product.baseSize.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Size Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Size Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedProduct.customSize ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width" className="text-sm font-medium mb-2 block">
                        Width ({selectedProduct.baseSize.unit})
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number.parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm font-medium mb-2 block">
                        Height ({selectedProduct.baseSize.unit})
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number.parseFloat(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Standard size: {selectedProduct.baseSize.width}" × {selectedProduct.baseSize.height}"
                    </p>
                  </div>
                )}

                {calculateArea() && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Total Area:</strong> {calculateArea()?.toFixed(2)} square meters
                    </p>
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
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-32"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-sm font-medium mb-2 block">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Grommets, hemming, mounting requirements, etc."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
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
                {!customDesign ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors">
                    <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drop your files here</h3>
                    <p className="text-gray-600 mb-4">Support: PDF, PNG, JPG, AI, PSD (Max 100MB)</p>
                    <Button variant="outline">Choose Files</Button>
                    <Separator className="my-6" />
                    <p className="text-gray-600 mb-4">Or create a custom design:</p>
                    <Button
                      onClick={() => setShowDesignEditor(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Palette className="mr-2 h-5 w-5" />
                      Customize Design
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={customDesign.customizedProductImage || "/placeholder.svg"}
                        alt="Current Design"
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div>
                        <p className="font-medium">Design Loaded</p>
                        <p className="text-sm text-gray-600">Your custom design is ready.</p>
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
                      <p className="font-medium text-red-900">Large Format Guidelines:</p>
                      <ul className="text-red-700 mt-1 space-y-1">
                        <li>• Minimum 150 DPI at final size</li>
                        <li>• Vector files preferred for scalability</li>
                        <li>• Include bleed for edge-to-edge printing</li>
                        <li>• Consider viewing distance for text size</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
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
                        {customWidth} × {customHeight} {selectedProduct.baseSize.unit}
                      </span>
                    </div>
                    {calculateArea() && (
                      <div className="flex justify-between">
                        <span>Area:</span>
                        <span>{calculateArea()?.toFixed(2)} sq m</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{quantity}</span>
                    </div>
                    {customDesign && (
                      <div className="flex justify-between">
                        <span>Design:</span>
                        <span className="text-red-600">Custom</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span>${selectedProduct.price.toFixed(2)}</span>
                  </div>
                  {selectedProduct.id === "banner" && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Area Cost:</span>
                      <span>${(calculateArea()! * selectedProduct.price).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-red-600">${calculatePrice().toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handleAddToCart} className="w-full bg-red-600 hover:bg-red-700" size="lg">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>

                <div className="text-center space-y-2">
                  
                  <Button
                    onClick={() => setShowQuoteModal(true)}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Request Detailed Quote
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Production Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Production Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Turnaround:</span>
                  <span className="font-medium">2-3 business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material:</span>
                  <span className="font-medium">13oz Vinyl</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Finishing:</span>
                  <span className="font-medium">Grommets available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installation:</span>
                  <span className="font-medium">Available</span>
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
          productImage={selectedProduct.image}
          productName={selectedProduct.name}
          initialDesign={
            customDesign
              ? {
                  elements: customDesign.elements,
                  zoom: customDesign.zoom,
                  productImage: customDesign.baseProductImage,
                }
              : null
          }
        />
      )}
      {showQuoteModal && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          serviceType="Large Format Printing"
          prefilledData={{
            product: selectedProduct,
            width: customWidth,
            height: customHeight,
            quantity: quantity,
            specialInstructions: specialInstructions,
            customDesign: customDesign,
          }}
        />
      )}
    </div>
  )
}
