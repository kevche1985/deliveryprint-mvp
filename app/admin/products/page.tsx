"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Edit, Trash2, Search, Package, Upload, Download, MoreHorizontal, UploadCloud, X as XIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/lib/language-context"

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  image: string | null
  is_active: boolean
  is_featured: boolean
  is_customizable: boolean
  variant_dimensions?: Array<{ name: string; key: string; options?: Array<{ value: string; price?: number; sku?: string | null }> }> | null
  created_at: string
}

type ProductMedia = {
  id: string
  product_id: string
  url: string
  media_type?: "image" | "video" | string | null
  poster_url?: string | null
  alt_text: string | null
  is_primary: boolean
  display_order: number | null
}

type ProductVariantRow = {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  attributes: Record<string, any>
  inventory: number
  is_enabled?: boolean | null
  image_url?: string | null
}

type Category = {
  id: string
  name: string
  description: string | null
  slug: string | null
  image_url: string | null
  is_active: boolean
  parent_id: string | null
  created_at?: string
}

export default function ProductManagement() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    is_active: true,
    is_featured: false,
    is_customizable: true,
  })
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const importFileRef = useRef<HTMLInputElement>(null)
  const mediaFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
  const MAX_VIDEO_SIZE = 25 * 1024 * 1024
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([])
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null)
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null)
  const [mediaAltText, setMediaAltText] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [isMediaUploading, setIsMediaUploading] = useState(false)
  const [variantsRows, setVariantsRows] = useState<ProductVariantRow[]>([])
  const [variantDimensions, setVariantDimensions] = useState<
    Array<{ name: string; key: string; options: Array<{ value: string; sku: string; price: number }> }>
  >([
    { name: "Size", key: "size", options: [] },
  ])
  const [isVariantsSaving, setIsVariantsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", is_active: true })

  const getAdminHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token || null
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: t("common.error"),
        description: t("admin.products.toasts.errorLoadingProducts"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({ title: t("common.error"), description: t("admin.products.toasts.errorLoadingCategories"), variant: "destructive" })
    }
  }

  const loadProductMedia = async (productId: string) => {
    try {
      const headers = await getAdminHeaders()
      if (headers.Authorization) {
        const resp = await fetch(`/api/admin/catalog/products/${productId}/media`, { headers })
        if (resp.ok) {
          const json = await resp.json().catch(() => ({}))
          setProductMedia((Array.isArray(json?.media) ? json.media : []) as ProductMedia[])
          return
        }
      }

      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true })
      if (error) throw error
      setProductMedia((data || []) as ProductMedia[])
    } catch (error) {
      console.error("Error loading product media:", error)
      toast({ title: t("common.error"), description: "Failed to load product media", variant: "destructive" })
    }
  }

  const loadProductVariants = async (productId: string) => {
    try {
      const headers = await getAdminHeaders()
      if (headers.Authorization) {
        const resp = await fetch(`/api/admin/catalog/products/${productId}/variants`, { headers })
        if (resp.ok) {
          const json = await resp.json().catch(() => ({}))
          setVariantsRows((Array.isArray(json?.variants) ? json.variants : []) as ProductVariantRow[])
          return
        }
      }

      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("name", { ascending: true })
      if (error) throw error
      setVariantsRows((data || []) as ProductVariantRow[])
    } catch (error) {
      console.error("Error loading product variants:", error)
      toast({ title: t("common.error"), description: "Failed to load variants", variant: "destructive" })
    }
  }

  const resetMediaInputs = () => {
    setSelectedMediaFile(null)
    setMediaPreviewUrl(null)
    setMediaAltText("")
    setMediaUrl("")
    setMediaType("image")
  }

  const inferMediaTypeFromUrl = (url: string): "image" | "video" => {
    const u = url.toLowerCase().split("?")[0].split("#")[0]
    if (u.endsWith(".mp4") || u.endsWith(".webm") || u.endsWith(".mov")) return "video"
    return "image"
  }

  const normalizeVariantAttrKey = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

  const isNewVariantId = (id: string) => id.startsWith("new:")

  const getPrimaryVariantKey = () => {
    const raw = (variantDimensions?.[0]?.key || "").trim()
    return raw || "size"
  }

  const getAttrString = (attrs: any, key: string): string | null => {
    if (!attrs || typeof attrs !== "object") return null
    const direct = (attrs as any)[key]
    if (typeof direct === "string") return direct
    const foundKey = Object.keys(attrs).find((k) => k.toLowerCase() === key.toLowerCase())
    const val = foundKey ? (attrs as any)[foundKey] : null
    return typeof val === "string" ? val : null
  }

  const normalizeSubVariant = (raw: string) => raw.trim()

  const parseVariantDimensionsFromProduct = (p: any) => {
    const arr = Array.isArray(p?.variant_dimensions) ? p.variant_dimensions : []
    const dims = arr
      .map((d: any) => {
        const name = typeof d?.name === "string" ? d.name : ""
        const key = typeof d?.key === "string" ? d.key : ""
        const optionsRaw = Array.isArray(d?.options) ? d.options : null
        const valuesRaw = !optionsRaw && Array.isArray(d?.values) ? d.values : []
        const options = (optionsRaw || valuesRaw.map((v: any) => ({ value: v, price: 0, sku: "" })))
          .map((o: any) => {
            const value = normalizeSubVariant(typeof o?.value === "string" ? o.value : String(o ?? ""))
            if (!value) return null
            const price = Number.isFinite(Number(o?.price)) ? Number(o.price) : 0
            const sku = typeof o?.sku === "string" ? o.sku : ""
            return { value, price, sku }
          })
          .filter(Boolean) as Array<{ value: string; price: number; sku: string }>
        return { name, key, options }
      })
      .filter((d: any) => d.name || d.key || (Array.isArray(d.options) && d.options.length > 0))
    if (dims.length > 0) return dims
    return [{ name: "Size", key: "size", options: [] }]
  }

  const serializeVariantDimensions = () => {
    const cleaned = variantDimensions
      .map((d) => {
        const name = d.name.trim()
        const key = (d.key || "").trim() || normalizeVariantAttrKey(name)
        const options = Array.from(
          new Map(
            (d.options || [])
              .map((o) => ({
                value: normalizeSubVariant(o.value || ""),
                price: Number.isFinite(Number(o.price)) ? Number(o.price) : 0,
                sku: typeof o.sku === "string" ? o.sku : "",
              }))
              .filter((o) => !!o.value)
              .map((o) => [o.value, o] as const),
          ).values(),
        )
        if (!name || !key || options.length === 0) return null
        return { name, key, options }
      })
      .filter(Boolean) as Array<{ name: string; key: string; options: Array<{ value: string; price: number; sku: string }> }>
    return cleaned
  }

  const persistVariantDimensions = async () => {
    if (!editingProduct) return
    const headers = await getAdminHeaders()
    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: Number.parseFloat(formData.price || "0") || 0,
      category: formData.category || null,
      image: formData.image || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_customizable: formData.is_customizable,
      variant_dimensions: serializeVariantDimensions(),
    }
    await fetch(`/api/admin/catalog/products/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    })
  }

  const isVideoMedia = (m: any) => {
    if (m?.media_type === "video") return true
    if (!m?.media_type && typeof m?.url === "string") return inferMediaTypeFromUrl(m.url) === "video"
    return false
  }

  const handleImageSelect = (file: File | null) => {
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
        toast({
          title: t("common.error"),
          description: `${t("admin.products.imageUpload.supportedFormats")} Max 5MB.`,
          variant: "destructive",
        })
        setSelectedImageFile(null)
        setImagePreviewUrl(null)
        return
      }
      setSelectedImageFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    } else {
      setSelectedImageFile(null)
      setImagePreviewUrl(null)
    }
  }

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    setIsImageUploading(true)
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
        throw new Error(`${t("admin.products.imageUpload.supportedFormats")} Max 5MB.`)
      }
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `product_images/${fileName}` // Folder inside the bucket

      const { data, error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath)

      if (!publicUrlData || !publicUrlData.publicUrl) {
        // Localize error message to ensure consistent user-facing language
        throw new Error(t("admin.products.toasts.imageUploadFailedDesc"))
      }

      toast({
        title: t("admin.products.toasts.imageUploadedTitle"),
        description: t("admin.products.toasts.imageUploadedDesc"),
      })
      return publicUrlData.publicUrl
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: t("admin.products.toasts.imageUploadFailedTitle"),
        description: error.message || t("admin.products.toasts.imageUploadFailedDesc"),
        variant: "destructive",
      })
      return null
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleMediaSelect = (file: File | null) => {
    if (!file) {
      setSelectedMediaFile(null)
      setMediaPreviewUrl(null)
      return
    }
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
    if ((!isImage && !isVideo) || (isImage && file.size > MAX_IMAGE_SIZE) || (isVideo && file.size > MAX_VIDEO_SIZE)) {
      toast({
        title: t("common.error"),
        description: isVideo ? "Supported videos: MP4/WEBM/MOV (max 25MB)." : `${t("admin.products.imageUpload.supportedFormats")} Max 5MB.`,
        variant: "destructive",
      })
      setSelectedMediaFile(null)
      setMediaPreviewUrl(null)
      return
    }
    setSelectedMediaFile(file)
    setMediaType(isVideo ? "video" : "image")
    setMediaPreviewUrl(URL.createObjectURL(file))
  }

  const uploadMediaToSupabase = async (file: File): Promise<{ url: string; mediaType: "image" | "video" } | null> => {
    setIsMediaUploading(true)
    try {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
      if (!isImage && !isVideo) {
        throw new Error("Unsupported file type")
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        throw new Error("Image too large (max 5MB)")
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        throw new Error("Video too large (max 25MB)")
      }
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `product_media/${fileName}`
      const { error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
      if (error) throw error
      const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath)
      if (!publicUrlData?.publicUrl) throw new Error("Could not get public URL")
      return { url: publicUrlData.publicUrl, mediaType: isVideo ? "video" : "image" }
    } catch (error: any) {
      console.error("Error uploading media:", error)
      toast({
        title: t("common.error"),
        description: error.message || "Upload failed",
        variant: "destructive",
      })
      return null
    } finally {
      setIsMediaUploading(false)
    }
  }

  const addMediaToProduct = async () => {
    if (!editingProduct) {
      toast({ title: t("common.error"), description: "Save the product first.", variant: "destructive" })
      return
    }
    let finalUrl = mediaUrl.trim()
    let mt: "image" | "video" = mediaType
    if (selectedMediaFile) {
      const uploaded = await uploadMediaToSupabase(selectedMediaFile)
      if (!uploaded) return
      finalUrl = uploaded.url
      mt = uploaded.mediaType
    } else {
      if (!finalUrl) {
        toast({ title: t("common.error"), description: "Provide a file or URL.", variant: "destructive" })
        return
      }
      mt = inferMediaTypeFromUrl(finalUrl)
    }
    const hasPrimaryImage = productMedia.some((m: any) => m.is_primary && !isVideoMedia(m))
    const shouldBePrimary = mt === "image" && !hasPrimaryImage
    const headers = await getAdminHeaders()
    const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ url: finalUrl, alt_text: mediaAltText.trim() || null, is_primary: shouldBePrimary }),
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      toast({ title: t("common.error"), description: data?.error || "Failed to add media", variant: "destructive" })
      return
    }
    resetMediaInputs()
    await loadProductMedia(editingProduct.id)
  }

  const setPrimaryMedia = async (mediaId: string) => {
    if (!editingProduct) return
    const row: any = productMedia.find((m) => m.id === mediaId)
    if (!row) return
    if (isVideoMedia(row)) {
      toast({ title: t("common.error"), description: "Primary media must be an image.", variant: "destructive" })
      return
    }
    const headers = await getAdminHeaders()
    const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "set_primary", mediaId }),
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      toast({ title: t("common.error"), description: data?.error || "Failed to set primary", variant: "destructive" })
      return
    }
    await loadProductMedia(editingProduct.id)
  }

  const removeMedia = async (mediaId: string) => {
    if (!editingProduct) return
    const headers = await getAdminHeaders()
    const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/media?mediaId=${encodeURIComponent(mediaId)}`, {
      method: "DELETE",
      headers,
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      toast({ title: t("common.error"), description: data?.error || "Failed to remove media", variant: "destructive" })
      return
    }
    await loadProductMedia(editingProduct.id)
  }

  const moveMedia = async (mediaId: string, direction: "up" | "down") => {
    if (!editingProduct) return
    const idx = productMedia.findIndex((m) => m.id === mediaId)
    if (idx < 0) return
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= productMedia.length) return
    const otherId = productMedia[targetIdx].id
    const headers = await getAdminHeaders()
    const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "swap_order", mediaId, otherId }),
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      toast({ title: t("common.error"), description: data?.error || "Failed to reorder", variant: "destructive" })
      return
    }
    await loadProductMedia(editingProduct.id)
  }

  const generateVariants = async () => {
    if (!editingProduct) {
      toast({ title: t("common.error"), description: "Save the product first.", variant: "destructive" })
      return
    }
    await persistVariantDimensions()
    toast({ title: t("common.success"), description: "Variant configuration saved." })
  }

  const addVariantRow = () => {
    if (!editingProduct) return
    const key = getPrimaryVariantKey()
    const tempId = `new:${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    setVariantsRows((prev) => [
      ...prev,
      {
        id: tempId,
        product_id: editingProduct.id,
        name: "",
        sku: null,
        price: Number.parseFloat(formData.price || "0") || 0,
        attributes: { [key]: "" },
        inventory: 0,
        is_enabled: true,
        image_url: null,
      },
    ])
  }

  const removeVariantRow = async (variantId: string) => {
    if (!editingProduct) return
    if (isNewVariantId(variantId)) {
      setVariantsRows((prev) => prev.filter((v) => v.id !== variantId))
      return
    }
    const headers = await getAdminHeaders()
    const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/variants?variantId=${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      headers,
    })
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      toast({ title: t("common.error"), description: data?.error || "Failed to delete variant", variant: "destructive" })
      return
    }
    await loadProductVariants(editingProduct.id)
  }

  const saveVariants = async () => {
    if (!editingProduct) return
    await persistVariantDimensions()
    if (variantsRows.length === 0) {
      await generateVariants()
      return
    }
    const skus = new Map<string, number>()
    for (const v of variantsRows) {
      const sku = (v.sku || "").trim()
      if (!sku) continue
      const count = (skus.get(sku) || 0) + 1
      skus.set(sku, count)
    }
    const dup = Array.from(skus.entries()).find(([, c]) => c > 1)
    if (dup) {
      toast({ title: t("common.error"), description: `Duplicate SKU: ${dup[0]}`, variant: "destructive" })
      return
    }
    setIsVariantsSaving(true)
    try {
      const headers = await getAdminHeaders()
      const newRows = variantsRows.filter((v) => isNewVariantId(v.id))
      const existingRows = variantsRows.filter((v) => !isNewVariantId(v.id))

      if (newRows.length > 0) {
        const rowsPayload = newRows.map((v: any) => {
          const attrs = typeof v?.attributes === "object" && v.attributes ? v.attributes : {}
          const fallbackName = Object.values(attrs)
            .map((x) => (typeof x === "string" ? x : ""))
            .filter(Boolean)
            .join(" / ")
          return {
            name: (v.name || "").trim() || fallbackName || "Variant",
            sku: v.sku,
            price: v.price,
            inventory: v.inventory,
            attributes: attrs,
            is_enabled: v.is_enabled !== false,
            image_url: v.image_url || null,
          }
        })
        const createResp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ rows: rowsPayload }),
        })
        if (!createResp.ok) {
          const data = await createResp.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to create variants")
        }
      }

      if (existingRows.length > 0) {
        const updates = existingRows.map((v: any) => ({
          id: v.id,
          name: v.name,
          attributes: v.attributes,
          sku: v.sku,
          price: v.price,
          inventory: v.inventory,
          is_enabled: v.is_enabled !== false,
          image_url: v.image_url || null,
        }))
        const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}/variants`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ updates }),
        })
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to save variants")
        }
      }
      toast({ title: t("common.success"), description: "Variants saved." })
      await loadProductVariants(editingProduct.id)
    } catch (e: any) {
      toast({ title: t("common.error"), description: e?.message || "Failed to save variants", variant: "destructive" })
    } finally {
      setIsVariantsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageUrlToSave = formData.image

    if (selectedImageFile) {
      const uploadedUrl = await uploadImageToSupabase(selectedImageFile)
      if (uploadedUrl) {
        imageUrlToSave = uploadedUrl
      } else {
        // If upload failed, prevent form submission or show error
        toast({
          title: t("admin.products.toasts.submissionFailedTitle"),
          description: t("admin.products.toasts.submissionFailedDesc"),
          variant: "destructive",
        })
        return // Stop form submission
      }
    }

    try {
      if (editingProduct) {
        const imageMedia = productMedia.filter((m: any) => !isVideoMedia(m))
        const hasPrimaryImage = imageMedia.some((m) => m.is_primary)
        if (imageMedia.length > 0 && !hasPrimaryImage) {
          toast({
            title: t("common.error"),
            description: "Set a primary image before saving.",
            variant: "destructive",
          })
          return
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        category: formData.category || null,
        image: imageUrlToSave || null, // Use the uploaded URL or existing one
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_customizable: formData.is_customizable,
        variant_dimensions: serializeVariantDimensions(),
      }

      const headers = await getAdminHeaders()
      if (editingProduct) {
        const resp = await fetch(`/api/admin/catalog/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(productData),
        })
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to save product")
        }
        toast({ title: t("common.success"), description: t("admin.products.toasts.productUpdated") })
      } else {
        const resp = await fetch(`/api/admin/catalog/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(productData),
        })
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to create product")
        }
        toast({ title: t("common.success"), description: t("admin.products.toasts.productCreated") })
      }

      handleDialogClose() // Use the new close handler
      loadProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: t("common.error"),
        description: (error as any)?.message || t("admin.products.toasts.saveProductFailed"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
    loadCategories()
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      image: product.image || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_customizable: (product as any).is_customizable ?? true,
    })
    setSelectedImageFile(null) // Clear any previously selected file
    setImagePreviewUrl(product.image || null) // Set preview if product has an image
    resetMediaInputs()
    setProductMedia([])
    setVariantsRows([])
    setVariantDimensions(parseVariantDimensionsFromProduct(product))
    loadProductMedia(product.id)
    loadProductVariants(product.id)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
      is_active: true,
      is_featured: false,
      is_customizable: true,
    })
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setIsImageUploading(false)
    resetMediaInputs()
    setProductMedia([])
    setVariantsRows([])
    setVariantDimensions([{ name: "Size", key: "size", options: [] }])
    setIsMediaUploading(false)
    setIsVariantsSaving(false)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t("admin.products.toasts.deleteConfirm"))) return

    try {
      const headers = await getAdminHeaders()
      const resp = await fetch(`/api/admin/catalog/products/${productId}`, { method: "DELETE", headers })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data?.error || "Delete failed")
      }

      toast({
        title: t("common.success"),
        description: t("admin.products.toasts.productDeleted"),
      })
      loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: t("common.error"),
        description: (error as any)?.message || t("admin.products.toasts.deleteProductFailed"),
        variant: "destructive",
      })
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(productId)
      } else {
        newSet.delete(productId)
      }
      return newSet
    })
  }

  const handleSelectAllProducts = (checked: boolean) => {
    if (checked) {
      const allProductIds = filteredProducts.map((p) => p.id)
      setSelectedProductIds(new Set(allProductIds))
    } else {
      setSelectedProductIds(new Set())
    }
  }

  const handleImport = async () => {
    if (!importFileRef.current?.files?.length) {
      toast({
        title: t("admin.products.toasts.noFileSelectedTitle"),
        description: t("admin.products.toasts.noFileSelectedDesc"),
        variant: "destructive",
      })
      return
    }

    const file = importFileRef.current.files[0]
    const formData = new FormData()
    formData.append("file", file)

    try {
      toast({
        title: t("admin.products.toasts.importingProductsTitle"),
        description: t("admin.products.toasts.importingProductsDesc"),
      })

      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errMsg: string | undefined
        try {
          const errorData = await response.json()
          errMsg = errorData.error
        } catch (_) {
          // If response is not JSON, fallback to a localized message
        }
        throw new Error(errMsg || t("admin.products.toasts.importFailedDesc"))
      }

      const result = await response.json()
      toast({
        title: t("admin.products.toasts.importCompleteTitle"),
        description: t("admin.products.toasts.importCompleteDesc")
          .replace("{created}", String(result.created))
          .replace("{updated}", String(result.updated)),
      })
      setIsImportDialogOpen(false)
      loadProducts() // Reload products after import
    } catch (error: any) {
      console.error("Error during import:", error)
      toast({
        title: t("admin.products.toasts.importFailedTitle"),
        description: error.message || t("admin.products.toasts.importFailedDesc"),
        variant: "destructive",
      })
    }
  }

  const handleExport = async (exportType: "all" | "selected") => {
    try {
      toast({
        title: t("admin.products.toasts.exportingProductsTitle"),
        description: t("admin.products.toasts.exportingProductsDesc"),
      })

      let url = "/api/admin/products/export"
      if (exportType === "selected" && selectedProductIds.size > 0) {
        url += `?ids=${Array.from(selectedProductIds).join(",")}`
      } else if (exportType === "selected" && selectedProductIds.size === 0) {
        toast({
          title: t("admin.products.toasts.noProductsSelectedTitle"),
          description: t("admin.products.toasts.noProductsSelectedDesc"),
          variant: "destructive",
        })
        return
      }

      const response = await fetch(url)

      if (!response.ok) {
        let errMsg: string | undefined
        try {
          const errorData = await response.json()
          errMsg = errorData.error
        } catch (_) {
          // If response is not JSON, fallback to a localized message
        }
        throw new Error(errMsg || t("admin.products.toasts.exportFailedDesc"))
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", `products_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: t("admin.products.toasts.exportCompleteTitle"),
        description: t("admin.products.toasts.exportCompleteDesc"),
      })
    } catch (error: any) {
      console.error("Error during export:", error)
      toast({
        title: t("admin.products.toasts.exportFailedTitle"),
        description: error.message || t("admin.products.toasts.exportFailedDesc"),
        variant: "destructive",
      })
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = filterCategory === "all" || product.category === filterCategory
    return matchesSearch && matchesCategory
  })


  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length
  const isSomeSelected = selectedProductIds.size > 0 && selectedProductIds.size < filteredProducts.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("admin.products.headerTitle")}</h1>
          <p className="text-gray-600">{t("admin.products.headerDescription")}</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                {t("admin.products.importDialog.triggerLabel")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("admin.products.importDialog.title")}</DialogTitle>
                <DialogDescription>{t("admin.products.importDialog.description")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">{t("admin.products.importDialog.csvFileLabel")}</Label>
                  <Input id="csv-file" type="file" accept=".csv" ref={importFileRef} />
                </div>
                <p className="text-sm text-gray-500">{t("admin.products.importDialog.csvGuidelines")}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="button" className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={handleImport}>
                  {t("admin.products.importDialog.uploadButton")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t("admin.products.exportMenu.triggerLabel")}
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("all")}>{t("admin.products.exportMenu.exportAll")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("selected")} disabled={selectedProductIds.size === 0}>
                {t("admin.products.exportMenu.exportSelectedWithCount").replace("{count}", String(selectedProductIds.size))}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (open) {
                setIsDialogOpen(true)
                loadCategories()
              } else {
                handleDialogClose()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.products.addButtonLabel")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? t("admin.products.editDialog.titleEdit") : t("admin.products.editDialog.titleAddNew")}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? t("admin.products.editDialog.descEdit") : t("admin.products.editDialog.descAddNew")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">{t("admin.products.form.imageLabel")}</Label>
                    <div
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleImageSelect(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => document.getElementById("image-file-input")?.click()}
                    >
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl || "/placeholder.svg"}
                          alt={t("admin.products.imageUpload.previewAlt")}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <>
                          <UploadCloud className="w-12 h-12 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">{t("admin.products.imageUpload.clickToUpload")}</span> {t("admin.products.imageUpload.orDragAndDrop")}
                          </p>
                          <p className="text-xs text-gray-500">{t("admin.products.imageUpload.supportedFormats")}</p>
                        </>
                      )}
                      <input
                        id="image-file-input"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageSelect(e.target.files[0])
                          }
                        }}
                      />
                    </div>
                    {imagePreviewUrl && (
                      <Button variant="outline" size="sm" onClick={() => handleImageSelect(null)} className="mt-2">
                        {t("admin.products.imageUpload.removeImage")}
                      </Button>
                    )}
                  </div>

                  {/* Existing Image URL input - make it read-only if a file is selected */}
                  <div className="space-y-2">
                    <Label htmlFor="image">{t("admin.products.form.imageUrlLabel")}</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder={t("admin.products.form.imageUrlPlaceholder")}
                      readOnly={!!selectedImageFile} // Make read-only if a file is selected for upload
                      disabled={isImageUploading} // Disable while uploading
                    />
                      {selectedImageFile && (
                      <p className="text-sm text-gray-500">
                        {t("admin.products.form.imageSelectedInfo")}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("admin.products.form.productNameLabel")}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isImageUploading} // Disable while uploading
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">{t("admin.products.form.priceLabel")}</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        disabled={isImageUploading} // Disable while uploading
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t("admin.products.form.descriptionLabel")}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      disabled={isImageUploading} // Disable while uploading
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="category">{t("admin.products.form.categoryLabel")}</Label>
                      <Select
                        value={formData.category || ""}
                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder={t("admin.products.form.categoryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* The image URL input is moved up */}
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        disabled={isImageUploading} // Disable while uploading
                      />
                      <Label htmlFor="is_active">{t("admin.products.form.activeLabel")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        disabled={isImageUploading} // Disable while uploading
                      />
                      <Label htmlFor="is_featured">{t("admin.products.form.featuredLabel")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_customizable"
                        checked={formData.is_customizable}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_customizable: checked })}
                        disabled={isImageUploading} // Disable while uploading
                      />
                      <Label htmlFor="is_customizable">Customizable</Label>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Media</div>
                      {editingProduct && (
                        <Button type="button" variant="outline" size="sm" onClick={() => loadProductMedia(editingProduct.id)}>
                          Refresh
                        </Button>
                      )}
                    </div>
                    {!editingProduct ? (
                      <p className="text-sm text-gray-500">Create or save the product first to manage media.</p>
                    ) : (
                      <>
                        {productMedia.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {productMedia.map((m: any, idx) => (
                              <div key={m.id} className="rounded-md border p-2">
                                <div className="aspect-square rounded bg-gray-50 overflow-hidden">
                                  {m.media_type === "video" ? (
                                    <video src={m.url} muted playsInline className="w-full h-full object-cover bg-black" />
                                  ) : (
                                    <img src={m.url || "/placeholder.svg"} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-600">
                                    {m.is_primary ? "Primary" : m.media_type === "video" ? "Video" : "Image"}
                                  </span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => moveMedia(m.id, "up")} disabled={idx === 0}>
                                    Up
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => moveMedia(m.id, "down")}
                                    disabled={idx === productMedia.length - 1}
                                  >
                                    Down
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPrimaryMedia(m.id)}
                                    disabled={m.media_type === "video" || m.is_primary}
                                  >
                                    Set primary
                                  </Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => removeMedia(m.id)}>
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No media yet.</p>
                        )}

                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-2 md:col-span-1">
                            <Label>Upload file</Label>
                            <div className="flex items-center gap-3">
                              <input
                                ref={mediaFileInputRef}
                                type="file"
                                accept="image/*,video/mp4,video/webm,video/quicktime"
                                className="hidden"
                                onChange={(e) => {
                                  handleMediaSelect(e.target.files?.[0] || null)
                                  e.currentTarget.value = ""
                                }}
                                disabled={isMediaUploading}
                              />
                              <Button
                                type="button"
                                className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                                onClick={() => mediaFileInputRef.current?.click()}
                                disabled={isMediaUploading}
                              >
                                Choose File
                              </Button>
                              <div className="text-sm text-gray-600 truncate">
                                {selectedMediaFile?.name || "no file selected"}
                              </div>
                            </div>
                            {mediaPreviewUrl && (
                              <div className="mt-2 rounded border p-2">
                                {mediaType === "video" ? (
                                  <video src={mediaPreviewUrl} muted playsInline className="w-full h-40 object-contain bg-black" />
                                ) : (
                                  <img src={mediaPreviewUrl} alt="" className="w-full h-40 object-contain" />
                                )}
                                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => handleMediaSelect(null)}>
                                  Clear
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Or paste URL</Label>
                                <Input
                                  value={mediaUrl}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setMediaUrl(v)
                                    if (v.trim()) setMediaType(inferMediaTypeFromUrl(v.trim()))
                                  }}
                                  placeholder="https://..."
                                  disabled={isMediaUploading || !!selectedMediaFile}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Alt text (optional)</Label>
                                <Input
                                  value={mediaAltText}
                                  onChange={(e) => setMediaAltText(e.target.value)}
                                  placeholder="Short description"
                                  disabled={isMediaUploading}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm text-gray-600">
                                Type: <span className="font-medium">{mediaType}</span>
                              </div>
                              <Button type="button" onClick={addMediaToProduct} disabled={isMediaUploading} className="bg-[#8B0000] hover:bg-[#6B0000]">
                                {isMediaUploading ? "Uploading..." : "Add media"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Variants</div>
                      {editingProduct && (
                        <Button type="button" variant="outline" size="sm" onClick={() => loadProductVariants(editingProduct.id)}>
                          Refresh
                        </Button>
                      )}
                    </div>
                    {!editingProduct ? (
                      <p className="text-sm text-gray-500">Create or save the product first to manage variants.</p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">Variants (up to 3). Each variant contains its own sub variants.</div>
                          <div className="space-y-3">
                            {variantDimensions.map((d, idx) => (
                              <div key={idx} className="grid gap-3 md:grid-cols-12 items-end">
                                <div className="md:col-span-4 space-y-2">
                                  <Label>Variant</Label>
                                  <Input
                                    value={d.name}
                                    onChange={(e) => {
                                      const next = [...variantDimensions]
                                      const name = e.target.value
                                      next[idx] = {
                                        ...next[idx],
                                        name,
                                        key: next[idx].key || normalizeVariantAttrKey(name),
                                      }
                                      setVariantDimensions(next)
                                    }}
                                  />
                                </div>
                                <div className="md:col-span-7 space-y-2">
                                  <Label>Sub variants</Label>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs text-gray-500">{d.options.length} sub variants</div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const next = [...variantDimensions]
                                        next[idx] = { ...next[idx], options: [...next[idx].options, { value: "", sku: "", price: 0 }] }
                                        setVariantDimensions(next)
                                      }}
                                    >
                                      Add Subvariant
                                    </Button>
                                  </div>
                                </div>
                                <div className="md:col-span-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={variantDimensions.length <= 1}
                                    onClick={() => setVariantDimensions((prev) => prev.filter((_, i) => i !== idx))}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (variantDimensions.length >= 3) return
                                setVariantDimensions((prev) => [...prev, { name: "", key: "", options: [] }])
                              }}
                              disabled={variantDimensions.length >= 3}
                            >
                              Add variant
                            </Button>
                            <Button type="button" onClick={generateVariants} className="bg-[#8B0000] hover:bg-[#6B0000]">
                              Save variants
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {variantDimensions.reduce((acc, d) => acc + (d.options?.length || 0), 0)} sub variants
                            </div>
                            <Button type="button" variant="outline" onClick={persistVariantDimensions}>
                              Save
                            </Button>
                          </div>

                          <div className="rounded-md border overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Variant</TableHead>
                                  <TableHead>Sub variant</TableHead>
                                  <TableHead>SKU</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead />
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {variantDimensions.flatMap((dim, dimIdx) =>
                                  (dim.options || []).map((opt, optIdx) => (
                                    <TableRow key={`${dim.key || dimIdx}:${optIdx}`}>
                                      <TableCell className="min-w-[220px]">
                                        <div className="text-sm font-medium">{dim.name || dim.key || `Variant ${dimIdx + 1}`}</div>
                                      </TableCell>
                                      <TableCell className="min-w-[240px]">
                                        <Input
                                          value={opt.value}
                                          onChange={(e) => {
                                            const next = [...variantDimensions]
                                            next[dimIdx] = {
                                              ...next[dimIdx],
                                              options: next[dimIdx].options.map((o, j) => (j === optIdx ? { ...o, value: e.target.value } : o)),
                                            }
                                            setVariantDimensions(next)
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="min-w-[180px]">
                                        <Input
                                          value={opt.sku || ""}
                                          onChange={(e) => {
                                            const next = [...variantDimensions]
                                            next[dimIdx] = {
                                              ...next[dimIdx],
                                              options: next[dimIdx].options.map((o, j) => (j === optIdx ? { ...o, sku: e.target.value } : o)),
                                            }
                                            setVariantDimensions(next)
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="min-w-[140px]">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={String(opt.price ?? 0)}
                                          onChange={(e) => {
                                            const next = [...variantDimensions]
                                            const price = Number.parseFloat(e.target.value || "0") || 0
                                            next[dimIdx] = {
                                              ...next[dimIdx],
                                              options: next[dimIdx].options.map((o, j) => (j === optIdx ? { ...o, price } : o)),
                                            }
                                            setVariantDimensions(next)
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="min-w-[120px]">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const next = [...variantDimensions]
                                            next[dimIdx] = { ...next[dimIdx], options: next[dimIdx].options.filter((_, j) => j !== optIdx) }
                                            setVariantDimensions(next)
                                          }}
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )),
                                )}
                                {variantDimensions.every((d) => (d.options?.length || 0) === 0) && (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-sm text-gray-500">
                                      Add sub variants above to configure pricing.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isImageUploading}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" className="bg-[#8B0000] hover:bg-[#6B0000]" disabled={isImageUploading}>
                    {isImageUploading
                      ? t("admin.products.imageUpload.uploading")
                      : editingProduct
                      ? t("admin.products.editDialog.buttons.update")
                      : t("admin.products.editDialog.buttons.create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.products.manageCategories")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("admin.products.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("admin.products.filterByCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.products.allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.products.cardTitleWithCount").replace("{count}", String(filteredProducts.length))}</CardTitle>
          <CardDescription>{t("admin.products.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAllProducts}
                    aria-label={t("admin.products.aria.selectAll")}
                    className={isSomeSelected ? "indeterminate" : ""}
                  />
                </TableHead>
                <TableHead>{t("admin.products.table.product")}</TableHead>
                <TableHead>{t("admin.products.table.category")}</TableHead>
                <TableHead>{t("admin.products.table.price")}</TableHead>
                <TableHead>{t("admin.products.table.status")}</TableHead>
                <TableHead>{t("admin.products.table.created")}</TableHead>
                <TableHead className="text-right">{t("admin.products.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProductIds.has(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      aria-label={t("admin.products.aria.selectProduct").replace("{name}", product.name)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            {t("admin.products.labels.featured")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || t("admin.products.na")}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? t("admin.products.statuses.active") : t("admin.products.statuses.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("admin.products.noProductsFound")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open)
          if (open) {
            setEditingCategory(null)
            setCategoryForm({ name: "", description: "", is_active: true })
            loadCategories()
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.products.manageCategories")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("admin.products.categories.title")}</DialogTitle>
            <DialogDescription>{t("admin.products.categories.description")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">{t("admin.products.categories.name")}</Label>
                  <Input id="cat-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-active">{t("admin.products.categories.active")}</Label>
                  <Switch id="cat-active" checked={categoryForm.is_active} onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">{t("admin.products.categories.descriptionLabel")}</Label>
                <Textarea id="cat-desc" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name: "", description: "", is_active: true })
                  }}
                >
                  {t("common.clear")}
                </Button>
                <Button
                  className="bg-[#8B0000] hover:bg-[#6B0000]"
                  onClick={async () => {
                    try {
                      if (!categoryForm.name.trim()) {
                        toast({ title: t("common.error"), description: t("admin.products.categories.nameRequired"), variant: "destructive" })
                        return
                      }
                      if (editingCategory) {
                        const { error } = await supabase
                          .from("categories")
                          .update({ name: categoryForm.name, description: categoryForm.description || null, is_active: categoryForm.is_active })
                          .eq("id", editingCategory.id)
                        if (error) throw error
                        toast({ title: t("common.success"), description: t("admin.products.categories.updated") })
                      } else {
                        const { error } = await supabase
                          .from("categories")
                          .insert([{ name: categoryForm.name, description: categoryForm.description || null, is_active: categoryForm.is_active }])
                        if (error) throw error
                        toast({ title: t("common.success"), description: t("admin.products.categories.created") })
                      }
                      setEditingCategory(null)
                      setCategoryForm({ name: "", description: "", is_active: true })
                      loadCategories()
                    } catch (error) {
                      console.error("Error saving category:", error)
                      toast({ title: t("common.error"), description: t("admin.products.categories.saveFailed"), variant: "destructive" })
                    }
                  }}
                >
                  {editingCategory ? t("admin.products.categories.update") : t("admin.products.categories.create")}
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.products.categories.table.name")}</TableHead>
                    <TableHead>{t("admin.products.categories.table.active")}</TableHead>
                    <TableHead className="text-right">{t("admin.products.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? t("common.active") : t("common.inactive")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(c)
                              setCategoryForm({ name: c.name || "", description: c.description || "", is_active: !!c.is_active })
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(t("admin.products.categories.deleteConfirm"))) return
                              try {
                                const { error } = await supabase.from("categories").delete().eq("id", c.id)
                                if (error) throw error
                                toast({ title: t("common.success"), description: t("admin.products.categories.deleted") })
                                loadCategories()
                              } catch (error) {
                                console.error("Error deleting category:", error)
                                toast({ title: t("common.error"), description: t("admin.products.categories.deleteFailed"), variant: "destructive" })
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
