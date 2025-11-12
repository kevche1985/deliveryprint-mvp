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
import { Plus, Edit, Trash2, Search, Package, Upload, Download, MoreHorizontal, UploadCloud } from "lucide-react"
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
  created_at: string
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    is_active: true,
    is_featured: false,
  })
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const importFileRef = useRef<HTMLInputElement>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)

  useEffect(() => {
    loadProducts()
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

  const handleImageSelect = (file: File | null) => {
    setSelectedImageFile(file)
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file))
    } else {
      setImagePreviewUrl(null)
    }
  }

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    setIsImageUploading(true)
    try {
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `product_images/${fileName}` // Folder inside the bucket

      const { data, error } = await supabase.storage.from("product-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
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
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        category: formData.category || null,
        image: imageUrlToSave || null, // Use the uploaded URL or existing one
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)
        if (error) throw error
        toast({ title: t("common.success"), description: t("admin.products.toasts.productUpdated") })
      } else {
        const { error } = await supabase.from("products").insert([productData])
        if (error) throw error
        toast({ title: t("common.success"), description: t("admin.products.toasts.productCreated") })
      }

      handleDialogClose() // Use the new close handler
      loadProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: t("common.error"),
        description: t("admin.products.toasts.saveProductFailed"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      image: product.image || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    })
    setSelectedImageFile(null) // Clear any previously selected file
    setImagePreviewUrl(product.image || null) // Set preview if product has an image
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
    })
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setIsImageUploading(false)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t("admin.products.toasts.deleteConfirm"))) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t("admin.products.toasts.productDeleted"),
      })
      loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: t("common.error"),
        description: t("admin.products.toasts.deleteProductFailed"),
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

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))

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

          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.products.addButtonLabel")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder={t("admin.products.form.categoryPlaceholder")}
                        disabled={isImageUploading} // Disable while uploading
                      />
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
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
    </div>
  )
}
