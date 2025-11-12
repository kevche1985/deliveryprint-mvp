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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2, ShoppingCart, Heart, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { getProductById, getProductImages, getProductVariants } from "@/lib/database"
import { useLanguage } from "@/lib/language-context"
import type { Product, ProductImage, ProductVariant } from "@/lib/database"
import { useCart } from "@/lib/cart-context"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

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
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  // Heuristic: treat apparel/wearables as products that should show standard size options
  const isWearable = React.useMemo(() => {
    const category = (product?.category || "").toLowerCase()
    const name = (product?.name || "").toLowerCase()
    return /wearables|apparel|clothing/.test(category) || /t\s?-?shirt|hoodie|sweatshirt|tank|tee|polo/.test(name)
  }, [product])

  const fallbackSizes = ["XS", "S", "M", "L", "XL", "XXL"]

  const sizes = React.useMemo(() => {
    const sizeList = variants
      .map((v) => (v.attributes && typeof v.attributes.size === "string" ? v.attributes.size : null))
      .filter((s): s is string => !!s)
    return Array.from(new Set(sizeList))
  }, [variants])

  const sizePrices = React.useMemo(() => {
    const m: Record<string, number> = {}
    variants.forEach((v) => {
      const s = v.attributes && typeof v.attributes.size === "string" ? (v.attributes.size as string) : null
      if (s) m[s] = v.price
    })
    return m
  }, [variants])
  const { addItem } = useCart()
  const { t } = useLanguage()
  const { user } = useAuth()

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
          const firstWithSize = variantsData.find((v) => v.attributes && typeof v.attributes.size === "string")
          if (firstWithSize) {
            setSelectedSize(firstWithSize.attributes.size as string)
            setSelectedVariant(firstWithSize.id)
          }
        }
        // If no variants with sizes and product appears to be a wearable, use fallback sizes
        if ((variantsData.length === 0 || !variantsData.some((v) => typeof v.attributes?.size === "string")) && productData) {
          const category = (productData.category || "").toLowerCase()
          const name = (productData.name || "").toLowerCase()
          const looksWearable = /wearables|apparel|clothing/.test(category) || /t\s?-?shirt|hoodie|sweatshirt|tank|tee|polo/.test(name)
          if (looksWearable) {
            setSelectedSize((prev) => prev || "M")
          }
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
      name: product.name + (variant ? ` - ${variant.name}` : selectedSize ? ` - ${selectedSize}` : ""),
      image: selectedImage || product.image || "/placeholder.svg?height=300&width=300",
      customizations: selectedSize ? { size: selectedSize } : undefined,
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
      name: product.name + (variant ? ` - ${variant.name}` : selectedSize ? ` - ${selectedSize}` : ""),
      image: selectedImage || product.image || "/placeholder.svg?height=300&width=300",
      customizations: { ...(designData || {}), ...(selectedSize ? { size: selectedSize } : {}) },
    })

    toast({
      title: "Design saved and added to cart",
      description: "Your customized product has been added to your cart",
    })
  }

  // NEW: Save and Share handlers
  const handleSaveProduct = async () => {
    if (!product) {
      toast({
        title: t("productDetail.notFoundTitle") || "Product not loaded",
        description: t("productDetail.notFoundDescription") || "Open a valid product from the products list",
        variant: "destructive",
      })
      return
    }
    try {
      if (!user) {
        toast({
          title: t("auth.loginRequiredTitle") || "Sign in required",
          description: t("auth.loginRequiredDescription") || "You must sign in to save products",
          variant: "destructive",
        })
        window.location.href = "/auth/login"
        return
      }

      const { data, error } = await supabase
        .from("digital_products")
        .insert([
          {
            user_id: user.id,
            type: "image",
            name: product.name,
            description: "Saved product",
            base_price: product.price,
            preview_url: selectedImage || product.image || "/placeholder.svg?height=600&width=600",
            status: "unpurchased",
            metadata: {
              product_id: product.id,
              variant_id: selectedVariant,
              quantity,
              source: "product_save",
              saved_at: new Date().toISOString(),
            },
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error saving product:", error)
        toast({
          title: t("productDetail.saveError") || "Error al guardar",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: t("productDetail.saveSuccess") || "Saved",
        description: t("productDetail.saveSuccessDesc") || `${product.name} saved to your library.`,
      })
    } catch (e: any) {
      console.error(e)
      toast({
        title: t("productDetail.saveError") || "Error al guardar",
        description: e?.message || "No se pudo guardar el producto",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      const url = window.location.href
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast({ title: t("productDetail.linkCopied") || "Link copiado", description: url })
      } else {
        // Fallback
        const textarea = document.createElement("textarea")
        textarea.value = url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
        toast({ title: t("productDetail.linkCopied") || "Link copiado", description: url })
      }

      // Exploratory: Web Share API (no social integrations yet)
      if ((navigator as any).share) {
        // Non-blocking attempt; if it fails we already copied
        ;(navigator as any)
          .share({ title: product?.name || "Producto", text: product?.description || "", url })
          .catch(() => {})
      }
    } catch (e: any) {
      console.error("Share error", e)
      toast({ title: t("productDetail.shareError") || "No se pudo compartir", variant: "destructive" })
    }
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
        <h1 className="text-2xl font-bold mb-4">{t("productDetail.notFoundTitle")}</h1>
        <p className="mb-6">{t("productDetail.notFoundDescription")}</p>
        <Button asChild>
          <a href="/products">{t("productDetail.backToProducts")}</a>
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

              {variants.length > 0 && sizes.length === 0 && (
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

              {sizes.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-2 block">{t("productDetail.size") || t("product.config.size") || "Size"}</Label>
                  <Select
                    value={selectedSize ?? ""}
                    onValueChange={(value) => {
                      setSelectedSize(value)
                      const match = variants.find((v) => v.attributes && v.attributes.size === value)
                      if (match) setSelectedVariant(match.id)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((sz) => (
                        <SelectItem key={sz} value={sz}>
                          {sz}{sizePrices[sz] !== undefined ? ` - $${sizePrices[sz].toFixed(2)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {sizes.length === 0 && variants.length === 0 && isWearable && (
                <div className="mb-6">
                  <Label className="mb-2 block">{t("productDetail.size") || t("product.config.size") || "Size"}</Label>
                  <Select
                    value={selectedSize ?? ""}
                    onValueChange={(value) => setSelectedSize(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fallbackSizes.map((sz) => (
                        <SelectItem key={sz} value={sz}>
                          {sz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="mb-6">
                <Label htmlFor="quantity" className="mb-2 block">
                  {t("productDetail.quantity")}
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
                  {t("productDetail.addToCart")}
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={handleSaveProduct} disabled={!product || loading}>
                    <Heart className="mr-2 h-4 w-4" />
                    {t("productDetail.save")}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("productDetail.share")}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">{t("productDetail.tabDetails")}</TabsTrigger>
              <TabsTrigger value="customize">{t("productDetail.tabCustomize")}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t("productDetail.specificationsTitle")}</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">{t("productDetail.materialLabel")}</span> {t("productDetail.materialValue")}
                      </li>
                      <li>
                        <span className="font-medium">{t("productDetail.dimensionsLabel")}</span> {t("productDetail.dimensionsValue")}
                      </li>
                      <li>
                        <span className="font-medium">{t("productDetail.printAreaLabel")}</span> {t("productDetail.printAreaValue")}
                      </li>
                      <li>
                        <span className="font-medium">{t("productDetail.careLabel")}</span> {t("productDetail.careValue")}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t("productDetail.shippingInfoTitle")}</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>
                        <span className="font-medium">{t("productDetail.productionTimeLabel")}</span> {t("productDetail.productionTimeValue")}
                      </li>
                      <li>
                        <span className="font-medium">{t("productDetail.shippingLabel")}</span> {t("productDetail.shippingValue")}
                      </li>
                      <li>
                        <span className="font-medium">{t("productDetail.returnsLabel")}</span> {t("productDetail.returnsValue")}
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
                        selectedVariant={selectedVariant || undefined}
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
    // Update state so the next render shows the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    // Notify parent component to handle error
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">There was an error loading the design editor.</p>
            <p className="text-xs text-gray-500 mt-2">Error: {this.state.error?.message}</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
