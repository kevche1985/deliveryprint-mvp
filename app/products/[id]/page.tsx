"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2, ShoppingCart, Heart, Share2, Upload, X, FileText, Link2, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { getProductById, getProductImages, getProductVariants } from "@/lib/database"
import { useLanguage } from "@/lib/language-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { QuoteRequestModal } from "@/components/quote-request-modal"
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
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null)
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("image")
  const [selectedMediaPoster, setSelectedMediaPoster] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [editorError, setEditorError] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({})
  // Bulk order quotation prompt state
  const [showBulkQuotePrompt, setShowBulkQuotePrompt] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteServiceType, setQuoteServiceType] = useState("Bulk Order")
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedLinks, setUploadedLinks] = useState<
    Array<{ uploaded_file_id: string; file_url: string; file_name: string; original_filename: string }>
  >([])
  const [uploadingDesigns, setUploadingDesigns] = useState(false)
  const [uploadNotes, setUploadNotes] = useState("")
  const [uploadUrl, setUploadUrl] = useState("")

  // Heuristic: treat apparel/wearables as products that should show standard size options
  const isWearable = React.useMemo(() => {
    const category = (product?.category || "").toLowerCase()
    const name = (product?.name || "").toLowerCase()
    return /wearables|apparel|clothing/.test(category) || /t\s?-?shirt|hoodie|sweatshirt|tank|tee|polo/.test(name)
  }, [product])

  const fallbackSizes = ["XS", "S", "M", "L", "XL", "XXL"]

  const enabledVariants = React.useMemo(() => variants.filter((v: any) => v?.is_enabled !== false), [variants])
  const variantDimensions = React.useMemo(
    () => (Array.isArray((product as any)?.variant_dimensions) ? ((product as any).variant_dimensions as any[]) : []),
    [product],
  )
  const hasOptionPricing = React.useMemo(
    () => variantDimensions.some((d: any) => Array.isArray(d?.options) && d.options.length > 0),
    [variantDimensions],
  )
  const usesVariantDropdowns = React.useMemo(
    () => hasOptionPricing && variantDimensions.length > 0,
    [hasOptionPricing, variantDimensions.length],
  )
  const usesCombinationVariants = React.useMemo(
    () => !hasOptionPricing && enabledVariants.length > 0 && variantDimensions.length > 0,
    [enabledVariants.length, hasOptionPricing, variantDimensions.length],
  )

  const getAttrString = (attrs: any, key: string): string | null => {
    if (!attrs || typeof attrs !== "object") return null
    const direct = (attrs as any)[key]
    if (typeof direct === "string") return direct
    const foundKey = Object.keys(attrs).find((k) => k.toLowerCase() === key.toLowerCase())
    const val = foundKey ? (attrs as any)[foundKey] : null
    return typeof val === "string" ? val : null
  }

  const sizes = React.useMemo(() => {
    const sizeList = enabledVariants
      .map((v) => getAttrString(v.attributes, "size"))
      .filter((s): s is string => !!s)
    return Array.from(new Set(sizeList))
  }, [enabledVariants])

  const sizePrices = React.useMemo(() => {
    const m: Record<string, number> = {}
    enabledVariants.forEach((v) => {
      const s = getAttrString(v.attributes, "size")
      if (s) m[s] = v.price
    })
    return m
  }, [enabledVariants])
  const { addItem } = useCart()
  const { t, language } = useLanguage()
  const { user } = useAuth()

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
        throw new Error(text || "Upload failed")
      }
      const data = await res.json().catch(() => ({}))
      if (!data?.uploadedFile?.id || !data?.uploadedFile?.file_url) {
        throw new Error("Upload returned an invalid response")
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

  useEffect(() => {
    async function loadProductData() {
      setLoading(true)
      try {
        const productData = await getProductById(productId)
        setProduct(productData)

        const imagesData = await getProductImages(productId)
        setImages(imagesData)
        if (imagesData.length > 0) {
          const primary = imagesData.find((m: any) => m.is_primary) || imagesData[0]
          const mt = (primary as any)?.media_type === "video" ? "video" : "image"
          setSelectedMediaUrl(primary.url)
          setSelectedMediaType(mt)
          setSelectedMediaPoster(((primary as any)?.poster_url as string | null) || null)
        } else {
          setSelectedMediaUrl(null)
          setSelectedMediaType("image")
          setSelectedMediaPoster(null)
        }

        const variantsData = await getProductVariants(productId)
        const enabled = (variantsData || []).filter((v: any) => v?.is_enabled !== false)
        setVariants(variantsData)
        if (enabled.length > 0) {
          setSelectedVariant(enabled[0].id)
          const firstWithSize = enabled.find((v) => !!getAttrString(v.attributes, "size"))
          if (firstWithSize) {
            setSelectedSize(getAttrString(firstWithSize.attributes, "size") as string)
            setSelectedVariant(firstWithSize.id)
          }
          const dims = Array.isArray((productData as any)?.variant_dimensions) ? ((productData as any).variant_dimensions as any[]) : []
          if (dims.length > 0) {
            const next: Record<string, string> = {}
            dims.forEach((d: any) => {
              const key = typeof d?.key === "string" ? d.key : ""
              if (!key) return
              if (Array.isArray(d?.options) && d.options.length > 0) {
                const firstOpt = d.options.find((o: any) => typeof o?.value === "string" && o.value.trim())
                if (firstOpt?.value) next[key] = String(firstOpt.value)
              }
            })
            setSelectedOptionValues(next)
          } else setSelectedOptionValues({})
        }
        // If no variants with sizes and product appears to be a wearable, use fallback sizes
        if ((enabled.length === 0 || !enabled.some((v) => typeof v.attributes?.size === "string")) && productData) {
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

  const getOptionValuesForDimension = React.useCallback(
    (dim: any): string[] => {
      const key = typeof dim?.key === "string" ? dim.key : ""
      if (!key) return []
      if (Array.isArray(dim?.options) && dim.options.length > 0) {
        return Array.from(new Set(dim.options.map((o: any) => String(o?.value || "").trim()).filter(Boolean)))
      }
      const vals = enabledVariants
        .map((v) => getAttrString((v as any).attributes, key))
        .filter((v): v is string => typeof v === "string" && !!v.trim())
      return Array.from(new Set(vals))
    },
    [enabledVariants],
  )

  const findMatchingVariantId = React.useCallback(
    (opts: Record<string, string>) => {
      const dims = variantDimensions.filter((d: any) => typeof d?.key === "string" && d.key.trim())
      if (dims.length === 0) return null
      const hasAll = dims.every((d: any) => typeof opts[d.key] === "string" && !!opts[d.key].trim())
      if (!hasAll) return null
      const match = enabledVariants.find((v: any) =>
        dims.every((d: any) => getAttrString(v.attributes, d.key) === opts[d.key]),
      )
      return match?.id || null
    },
    [enabledVariants, variantDimensions],
  )

  useEffect(() => {
    if (!usesCombinationVariants) return
    const matchId = findMatchingVariantId(selectedOptionValues)
    if (!matchId) return
    if (matchId !== selectedVariant) setSelectedVariant(matchId)
    const match: any = enabledVariants.find((v: any) => v.id === matchId) || null
    const imgUrl = typeof match?.image_url === "string" ? match.image_url : null
    if (imgUrl) {
      setSelectedMediaUrl(imgUrl)
      setSelectedMediaType("image")
      setSelectedMediaPoster(null)
    }
    const sizeFromOptions = typeof selectedOptionValues.size === "string" ? selectedOptionValues.size : null
    if (sizeFromOptions) setSelectedSize(sizeFromOptions)
  }, [enabledVariants, findMatchingVariantId, selectedOptionValues, selectedVariant, usesCombinationVariants])

  const optionPrice = React.useMemo(() => {
    if (!usesVariantDropdowns) return 0
    let sum = 0
    variantDimensions.forEach((d: any) => {
      const key = typeof d?.key === "string" ? d.key : ""
      if (!key) return
      const selected = selectedOptionValues[key]
      if (!selected) return
      const opt = Array.isArray(d?.options) ? d.options.find((o: any) => String(o?.value || "") === selected) : null
      const price = Number.isFinite(Number(opt?.price)) ? Number(opt.price) : 0
      sum += price
    })
    return sum
  }, [selectedOptionValues, usesVariantDropdowns, variantDimensions])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  const proceedAddToCart = (finalUploadedLinks: typeof uploadedLinks) => {
    if (!product) return
    const variant = variants.find((v) => v.id === selectedVariant)
    const primaryMedia = images.find((m: any) => m.is_primary) || images[0] || null
    const selectedCartImage =
      selectedMediaType === "image" && selectedMediaUrl
        ? selectedMediaUrl
        : (primaryMedia && (primaryMedia as any)?.media_type !== "video"
            ? primaryMedia.url
            : product.image) || "/placeholder.svg?height=300&width=300"
    const hasSize = !!selectedSize
    const hasUploads = (finalUploadedLinks?.length || 0) > 0
    const hasNotes = !!uploadNotes.trim()
    const hasUrl = !!uploadUrl.trim()
    const optionSelections =
      usesVariantDropdowns && variantDimensions.length > 0
        ? variantDimensions
            .map((d: any) => {
              const key = typeof d?.key === "string" ? d.key : ""
              const name = typeof d?.name === "string" ? d.name : key
              const value = key ? selectedOptionValues[key] : ""
              if (!key || !value) return null
              return { key, name, value }
            })
            .filter(Boolean)
        : []
    const customizations =
      hasSize || hasUploads || hasNotes || hasUrl || optionSelections.length > 0
        ? {
            ...(hasSize ? { size: selectedSize } : {}),
            ...(optionSelections.length > 0 ? { option_selections: optionSelections } : {}),
            ...(hasUploads
              ? {
                  uploadedFiles: finalUploadedLinks,
                  uploaded_file_id: finalUploadedLinks?.[0]?.uploaded_file_id || null,
                  design_file_url: finalUploadedLinks?.[0]?.file_url || null,
                }
              : {}),
            ...(hasNotes ? { design_notes: uploadNotes.trim() } : {}),
            ...(hasUrl ? { design_source_url: uploadUrl.trim() } : {}),
          }
        : undefined
    addItem({
      productId: product.id,
      variantId: usesVariantDropdowns ? undefined : selectedVariant || undefined,
      quantity,
      price: usesVariantDropdowns ? (product.price || 0) + optionPrice : variant ? variant.price : product.price,
      name:
        product.name +
        (usesVariantDropdowns
          ? ` - ${variantDimensions
              .map((d: any) => {
                const key = typeof d?.key === "string" ? d.key : ""
                const val = key ? selectedOptionValues[key] : ""
                return String(val || "").trim()
              })
              .filter(Boolean)
              .join(" / ")}`
          : variant
            ? ` - ${variant.name}`
            : selectedSize
              ? ` - ${selectedSize}`
              : ""),
      image: selectedCartImage,
      customizations,
    })
  }

  const handleAddToCart = async () => {
    if (!product) return
    if (quantity > 49) {
      setQuoteServiceType(product?.name || "Bulk Order")
      setShowBulkQuotePrompt(true)
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
          title: t("common.toast.error") || "Error",
          description: e?.message || "Failed to upload file",
          variant: "destructive",
        })
        return
      } finally {
        setUploadingDesigns(false)
      }
    }
    proceedAddToCart(finalUploadedLinks)
  }

  const handleSaveDesign = (designData: any) => {
    if (!product) return
    if (!product.is_customizable) {
      toast({
        title: t("productDetail.notCustomizable") || "Not customizable",
        description: t("productDetail.notCustomizableDesc") || "This product cannot be customized.",
        variant: "destructive",
      })
      return
    }

    // Find the selected variant
    const variant = variants.find((v) => v.id === selectedVariant)

    const hasUploads = uploadedLinks.length > 0
    const hasNotes = !!uploadNotes.trim()
    const hasUrl = !!uploadUrl.trim()

    // Add to cart with design data
    addItem({
      productId: product.id,
      variantId: selectedVariant || undefined,
      designId: undefined, // This would be set if saving a design to the database
      quantity,
      price: variant ? variant.price : product.price,
      name: product.name + (variant ? ` - ${variant.name}` : selectedSize ? ` - ${selectedSize}` : ""),
      image:
        (selectedMediaType === "image" && selectedMediaUrl ? selectedMediaUrl : product.image) ||
        "/placeholder.svg?height=300&width=300",
      customizations: {
        ...(designData || {}),
        ...(selectedSize ? { size: selectedSize } : {}),
        ...(hasUploads
          ? {
              uploadedFiles: uploadedLinks,
              uploaded_file_id: uploadedLinks?.[0]?.uploaded_file_id || null,
              design_file_url: uploadedLinks?.[0]?.file_url || null,
            }
          : {}),
        ...(hasNotes ? { design_notes: uploadNotes.trim() } : {}),
        ...(hasUrl ? { design_source_url: uploadUrl.trim() } : {}),
      },
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
            preview_url:
              (selectedMediaType === "image" && selectedMediaUrl ? selectedMediaUrl : product.image) ||
              "/placeholder.svg?height=600&width=600",
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

  const selectedVariantObj = React.useMemo(
    () => enabledVariants.find((v) => v.id === selectedVariant) || null,
    [enabledVariants, selectedVariant],
  )

  const productMedia = React.useMemo(() => {
    if (images.length > 0) return images as any[]
    if (product?.image) {
      return [
        {
          id: "legacy",
          url: product.image,
          media_type: "image",
          poster_url: null,
          alt_text: null,
          is_primary: true,
          display_order: 0,
        },
      ] as any[]
    }
    return [] as any[]
  }, [images, product?.image])

  const selectedMediaIndex = React.useMemo(() => {
    if (!selectedMediaUrl) return 0
    const idx = productMedia.findIndex((m) => m?.url === selectedMediaUrl)
    return idx >= 0 ? idx : 0
  }, [productMedia, selectedMediaUrl])

  const setMediaByIndex = (idx: number) => {
    if (productMedia.length === 0) return
    const safeIdx = ((idx % productMedia.length) + productMedia.length) % productMedia.length
    const m: any = productMedia[safeIdx]
    const mt: "image" | "video" = m?.media_type === "video" ? "video" : "image"
    setSelectedMediaUrl(m?.url || null)
    setSelectedMediaType(mt)
    setSelectedMediaPoster((m?.poster_url as string | null) || null)
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
              <div className="grid grid-cols-[72px_1fr] gap-3 p-3">
                <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
                  {productMedia.map((m: any, idx: number) => {
                    const active = idx === selectedMediaIndex
                    return (
                      <button
                        key={m.id || m.url || idx}
                        type="button"
                        className={`w-16 h-16 rounded-md overflow-hidden border-2 ${active ? "border-[#8B0000]" : "border-transparent"}`}
                        onClick={() => setMediaByIndex(idx)}
                      >
                        {m?.media_type === "video" ? (
                          <video src={m.url} muted playsInline className="w-full h-full object-cover bg-black" />
                        ) : (
                          <img src={m.url || "/placeholder.svg"} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="aspect-square relative rounded-md overflow-hidden bg-white">
                  {selectedMediaType === "video" && selectedMediaUrl ? (
                    <video
                      src={selectedMediaUrl}
                      poster={selectedMediaPoster || undefined}
                      controls
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={selectedMediaUrl || product.image || "/placeholder.svg?height=600&width=600&query=product"}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {productMedia.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setMediaByIndex(selectedMediaIndex - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border rounded-full p-2 shadow"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaByIndex(selectedMediaIndex + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border rounded-full p-2 shadow"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-[#8B0000]">
                  ${(usesVariantDropdowns ? (product.price || 0) + optionPrice : (selectedVariantObj?.price ?? product.price)).toFixed(2)}
                </span>
                {enabledVariants.length > 0 && selectedVariant && (
                  <span className="ml-2 text-sm text-gray-500">(Starting from - varies by option)</span>
                )}
              </div>

              {usesVariantDropdowns && (
                <div className="mb-6 space-y-4">
                  {variantDimensions.slice(0, 3).map((dim: any) => {
                    const key = typeof dim?.key === "string" ? dim.key : ""
                    if (!key) return null
                    const label = typeof dim?.name === "string" && dim.name.trim() ? dim.name : key
                    const values = getOptionValuesForDimension(dim)
                    const value = selectedOptionValues[key]
                    return (
                      <div key={key}>
                        <Label className="mb-2 block">{label}</Label>
                        <Select
                          value={value || undefined}
                          onValueChange={(v) => {
                            const next = { ...selectedOptionValues, [key]: v }
                            setSelectedOptionValues(next)
                            if (key === "size") setSelectedSize(v)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("common.selectOption") || "Choose an option"} />
                          </SelectTrigger>
                          <SelectContent>
                            {values.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
              )}

              {!usesVariantDropdowns && enabledVariants.length > 0 && sizes.length === 0 && (
                <div className="mb-6">
                  <Label className="mb-2 block">Options</Label>
                  <div className="flex flex-wrap gap-2">
                    {enabledVariants.map((variant: any) => {
                      const active = selectedVariant === variant.id
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(variant.id)
                            const imgUrl = typeof variant?.image_url === "string" ? variant.image_url : null
                            if (imgUrl) {
                              setSelectedMediaUrl(imgUrl)
                              setSelectedMediaType("image")
                              setSelectedMediaPoster(null)
                            }
                          }}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            active ? "border-[#8B0000] bg-[#8B0000] text-white" : "border-gray-300 bg-white hover:border-[#8B0000]/60"
                          }`}
                        >
                          <span className="font-medium">{variant.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!usesVariantDropdowns && sizes.length > 0 && (
                <div className="mb-6">
                  <Label className="mb-2 block">{t("productDetail.size") || t("product.config.size") || "Size"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((sz) => {
                      const active = selectedSize === sz
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setSelectedSize(sz)
                            const match: any = enabledVariants.find((v) => getAttrString(v.attributes, "size") === sz) || null
                            if (match?.id) {
                              setSelectedVariant(match.id)
                              const imgUrl = typeof match?.image_url === "string" ? match.image_url : null
                              if (imgUrl) {
                                setSelectedMediaUrl(imgUrl)
                                setSelectedMediaType("image")
                                setSelectedMediaPoster(null)
                              }
                            }
                          }}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            active ? "border-[#8B0000] bg-[#8B0000] text-white" : "border-gray-300 bg-white hover:border-[#8B0000]/60"
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {sizes.length === 0 && enabledVariants.length === 0 && isWearable && (
                <div className="mb-6">
                  <Label className="mb-2 block">{t("productDetail.size") || t("product.config.size") || "Size"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {fallbackSizes.map((sz) => {
                      const active = selectedSize === sz
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                            active ? "border-[#8B0000] bg-[#8B0000] text-white" : "border-gray-300 bg-white hover:border-[#8B0000]/60"
                          }`}
                        >
                          {sz}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="mb-6">
                <Label className="mb-2 block">{t("productDetail.upload.title") || "Upload your files"}</Label>
                <p className="text-xs text-gray-500 mb-3">
                  {t("productDetail.upload.subtitle") ||
                    "Upload your design ready for print. Accepted: PDF, PSD, AI, EPS, SVG, PNG, JPG."}
                </p>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 bg-white transition-colors ${
                    dragActive ? "border-[#8B0000] bg-red-50" : "border-gray-300 hover:border-[#8B0000]/60"
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragActive(false)
                    const files = Array.from(e.dataTransfer.files || [])
                    if (files.length === 0) return
                    const next = [...uploadedFiles, ...files]
                      .filter((f) => f.size <= 50 * 1024 * 1024)
                      .slice(0, 10)
                    setUploadedFiles(next)
                    setUploadedLinks([])
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Upload className="h-4 w-4 text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate">
                          {t("productDetail.upload.dropzone") || "Drop files here or click to browse"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {t("productDetail.upload.maxHint") || "Up to 10 files • Max 50MB each"}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => document.getElementById("product-upload-input")?.click()}
                      disabled={uploadingDesigns}
                    >
                      {uploadingDesigns ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("productDetail.upload.uploading") || "Uploading..."}
                        </>
                      ) : (
                        <>{t("productDetail.upload.browse") || "Browse files"}</>
                      )}
                    </Button>
                  </div>
                  <input
                    id="product-upload-input"
                    type="file"
                    multiple
                    accept=".pdf,.psd,.ai,.eps,.svg,.png,.jpg,.jpeg,application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      e.target.value = ""
                      if (files.length === 0) return
                      const next = [...uploadedFiles, ...files]
                        .filter((f) => f.size <= 50 * 1024 * 1024)
                        .slice(0, 10)
                      setUploadedFiles(next)
                      setUploadedLinks([])
                    }}
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                            <span className="truncate">{f.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {Math.round((f.size / (1024 * 1024)) * 10) / 10}MB
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                              setUploadedLinks([])
                            }}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="text-sm">{t("productDetail.upload.urlLabel") || "Design URL (optional)"}</Label>
                    <div className="relative mt-1">
                      <Link2 className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={uploadUrl}
                        onChange={(e) => setUploadUrl(e.target.value)}
                        placeholder={t("productDetail.upload.urlPlaceholder") || "Paste a Canva/Drive/Dropbox link"}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">{t("productDetail.upload.notesLabel") || "Notes (optional)"}</Label>
                    <Textarea
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder={
                        t("productDetail.upload.notesPlaceholder") ||
                        "Add instructions (size, bleed, colors, finishing, etc.)"
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
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
            <TabsList className={`grid w-full ${product?.is_customizable ? "grid-cols-2" : "grid-cols-1"}`}>
              <TabsTrigger value="details">{t("productDetail.tabDetails")}</TabsTrigger>
              {product?.is_customizable && (
                <TabsTrigger value="customize">{t("productDetail.tabCustomize")}</TabsTrigger>
              )}
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
            {product?.is_customizable ? (
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
                          productImage={
                            (selectedMediaType === "image" && selectedMediaUrl ? selectedMediaUrl : product.image) ||
                            "/placeholder.svg?height=600&width=600"
                          }
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
            ) : (
              <TabsContent value="customize">
                <CardContent className="p-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                    {t("productDetail.notCustomizable") || "This product cannot be customized."}
                  </div>
                </CardContent>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      {/* Bulk order quotation prompt */}
      <Dialog open={showBulkQuotePrompt} onOpenChange={setShowBulkQuotePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "es" ? "¿Quieres una cotización?" : "Would you like a quotation?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            {language === "es"
              ? "Has seleccionado 50 o más unidades. Podemos ofrecer mejores precios con una cotización."
              : "You've selected 50+ units. We can offer better pricing with a quotation."}
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkQuotePrompt(false)
                proceedAddToCart(uploadedLinks)
              }}
            >
              {language === "es" ? "Continuar sin cotización" : "Continue without quote"}
            </Button>
            <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => { setShowBulkQuotePrompt(false); setShowQuoteModal(true) }}>
              {language === "es" ? "Solicitar cotización" : "Request a quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          serviceType={quoteServiceType}
          prefilledData={{ productId: product?.id, productName: product?.name, quantity, variant: selectedVariant, size: selectedSize }}
        />
      )}
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
