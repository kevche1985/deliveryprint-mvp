"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, ShoppingCart, Heart, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { getProductById, getProductImages, getProductVariants } from "@/lib/database"
import type { Product, ProductImage, ProductVariant } from "@/lib/database"
import { useCart } from "@/lib/cart-context"
import { toast } from "@/components/ui/use-toast"

// Replace the existing dynamic imports with this:
const DesignEditor = dynamic(
  () => import("@/components/design-editor").catch(() => import("@/components/design-editor-fallback")),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B0000] mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading Design Editor...</p>
        </div>
      </div>
    ),
  },
)

// Remove the separate DesignEditorFallback import since it's now handled above

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [editorError, setEditorError] = useState(false)

  const { addItem } = useCart()

  useEffect(() => {
    async function loadProductData() {
      setLoading(true)
      try {
        const productData = await getProductById(productId)
        setProduct(productData)

        const imagesData = await getProductImages(productId)
        setImages(imagesData)
        if (imagesData.length > 0) {
          const primaryImage = imagesData.find((img) => img.is_primary)
          setSelectedImage(primaryImage ? primaryImage.url : imagesData[0].url)
        }

        const variantsData = await getProductVariants(productId)
        setVariants(variantsData)
        if (variantsData.length > 0) {
          setSelectedVariant(variantsData[0].id)
        }
      } catch (error) {
        console.error("Error loading product data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProductData()
    }
  }, [productId])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    // Find the selected variant
    const variant = variants.find((v) => v.id === selectedVariant)

    // Add to cart
    addItem({
      productId: product.id,
      variantId: selectedVariant || undefined,
      quantity,
      price: variant ? variant.price : product.price,
      name: product.name + (variant ? ` - ${variant.name}` : ""),
      image: selectedImage || product.image || "/placeholder.svg?height=300&width=300",
    })
  }

  const handleSaveDesign = (designData: any) => {
    if (!product) return

    // Find the selected variant
    const variant = variants.find((v) => v.id === selectedVariant)

    // Add to cart with design data
    addItem({
      productId: product.id,
      variantId: selectedVariant || undefined,
      designId: undefined, // This would be set if saving a design to the database
      quantity,
      price: variant ? variant.price : product.price,
      name: product.name + (variant ? ` - ${variant.name}` : ""),
      image: selectedImage || product.image || "/placeholder.svg?height=300&width=300",
      customizations: designData, // Add the design data to customizations
    })

    toast({
      title: "Design saved and added to cart",
      description: "Your customized product has been added to your cart",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <a href="/products">Back to Products</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="aspect-square relative">
                <img
                  src={selectedImage || product.image || "/placeholder.svg?height=600&width=600&query=product"}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              {images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                        selectedImage === image.url ? "border-[#8B0000]" : "border-transparent"
                      }`}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt_text || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-[#8B0000]">${product.price.toFixed(2)}</span>
                {variants.length > 0 && selectedVariant && (
                  <span className="ml-2 text-sm text-gray-500">(Starting from - varies by option)</span>
                )}
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              {variants.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-2 block">Options</Label>
                  <RadioGroup
                    value={selectedVariant || ""}
                    onValueChange={setSelectedVariant}
                    className="grid grid-cols-2 gap-2"
                  >
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={variant.id} id={variant.id} />
                        <Label htmlFor={variant.id} className="cursor-pointer">
                          {variant.name} (${variant.price.toFixed(2)})
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="mb-6">
                <Label htmlFor="quantity" className="mb-2 block">
                  Quantity
                </Label>
                <div className="flex w-1/3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="rounded-r-none"
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="rounded-l-none"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Button onClick={handleAddToCart} className="bg-[#8B0000] hover:bg-[#6B0000]">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="customize">Customize Design</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Product Specifications</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">Material:</span> Premium Quality
                      </li>
                      <li>
                        <span className="font-medium">Dimensions:</span> Varies by size
                      </li>
                      <li>
                        <span className="font-medium">Print Area:</span> Front and back
                      </li>
                      <li>
                        <span className="font-medium">Care:</span> Machine washable
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">Production Time:</span> 2-3 business days
                      </li>
                      <li>
                        <span className="font-medium">Shipping:</span> 3-5 business days
                      </li>
                      <li>
                        <span className="font-medium">Returns:</span> 30-day return policy
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="customize">
              <CardContent className="p-6">
                <div className="min-h-[400px]">
                  <ErrorBoundary onError={() => setEditorError(true)}>
                    <React.Suspense
                      fallback={
                        <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#8B0000] mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Loading Design Editor...</p>
                          </div>
                        </div>
                      }
                    >
                      <DesignEditor
                        productImage={selectedImage || product.image || "/placeholder.svg?height=600&width=600"}
                        printArea={{ x: 150, y: 150, width: 300, height: 300 }}
                        onSave={handleSaveDesign}
                        productName={product.name}
                        product={product}
                        variants={variants}
                        selectedVariant={selectedVariant}
                      />
                    </React.Suspense>
                  </ErrorBoundary>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

// Replace the existing ErrorBoundary class with this improved version:
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("DesignEditor Error:", error, errorInfo)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center p-6">
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Design Editor Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">
              The design editor couldn't load. You can still add this product to your cart.
            </p>
            <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
