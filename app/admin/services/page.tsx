"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, UploadCloud, MoreHorizontal, Download, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"

type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  image: string | null
  price: number
  is_active: boolean
  is_featured: boolean
  slug: string | null
  created_at: string
}

export default function ServicesManagement() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    image: "",
    price: "",
    slug: "",
    is_active: true,
    is_featured: false,
  })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error loading services:", error)
      toast({ title: t("common.error"), description: "Failed to load services", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (file: File | null) => {
    setSelectedImageFile(file)
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    setIsImageUploading(true)
    try {
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const filePath = `service_images/${fileName}`
      const { error } = await supabase.storage.from("product-images").upload(filePath, file, { cacheControl: "3600", upsert: false })
      if (error) throw error
      const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath)
      return publicUrlData?.publicUrl || null
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({ title: "Image Upload Failed", description: error.message, variant: "destructive" })
      return null
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let imageUrlToSave = formData.image
    if (selectedImageFile) {
      const uploaded = await uploadImageToSupabase(selectedImageFile)
      if (uploaded) imageUrlToSave = uploaded
      else {
        toast({ title: "Submission Failed", description: "Image upload failed", variant: "destructive" })
        return
      }
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        image: imageUrlToSave || null,
        price: Number.parseFloat(formData.price || "0"),
        slug: formData.slug || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      }

      if (editingService) {
        const { error } = await supabase.from("services").update(payload).eq("id", editingService.id)
        if (error) throw error
        toast({ title: t("common.success"), description: "Service updated" })
      } else {
        const { error } = await supabase.from("services").insert([payload])
        if (error) throw error
        toast({ title: t("common.success"), description: "Service created" })
      }

      handleDialogClose()
      loadServices()
    } catch (error) {
      console.error("Error saving service:", error)
      toast({ title: t("common.error"), description: "Failed to save service", variant: "destructive" })
    }
  }

  const handleEdit = (svc: Service) => {
    setEditingService(svc)
    setFormData({
      name: svc.name,
      description: svc.description || "",
      category: svc.category || "",
      image: svc.image || "",
      price: String(svc.price ?? 0),
      slug: svc.slug || "",
      is_active: svc.is_active,
      is_featured: svc.is_featured,
    })
    setSelectedImageFile(null)
    setImagePreviewUrl(svc.image || null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData({ name: "", description: "", category: "", image: "", price: "", slug: "", is_active: true, is_featured: false })
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setIsImageUploading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return
    try {
      const { error } = await supabase.from("services").delete().eq("id", id)
      if (error) throw error
      toast({ title: t("common.success"), description: "Service deleted" })
      loadServices()
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({ title: t("common.error"), description: "Failed to delete service", variant: "destructive" })
    }
  }

  const filteredServices = services.filter((s) => {
    const q = searchQuery.toLowerCase()
    return s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage service entries shown across the Services pages.</p>
        </div>
        <div className="flex space-x-2">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (open) setIsDialogOpen(true)
              else handleDialogClose()
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-[#8B0000] hover:bg-[#6B0000]">
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
                <DialogDescription>Upload image, set price, and control visibility.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Service Image</Label>
                    <div
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleImageSelect(e.dataTransfer.files[0])
                        }
                      }}
                      onClick={() => document.getElementById("service-image-file")?.click()}
                    >
                      {imagePreviewUrl ? (
                        <img src={imagePreviewUrl || "/placeholder.svg"} alt="Service preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <>
                          <UploadCloud className="w-12 h-12 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG</p>
                        </>
                      )}
                      <input id="service-image-file" type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
                    </div>
                    {imagePreviewUrl && (
                      <Button variant="outline" size="sm" onClick={() => handleImageSelect(null)} className="mt-2">
                        Remove Image
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input id="image" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} readOnly={!!selectedImageFile} disabled={isImageUploading} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Service Name</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={isImageUploading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Starting Price</Label>
                      <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required disabled={isImageUploading} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={isImageUploading} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={isImageUploading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} disabled={isImageUploading} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} disabled={isImageUploading} />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} disabled={isImageUploading} />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isImageUploading}>Cancel</Button>
                  <Button type="submit" className="bg-[#8B0000] hover:bg-[#6B0000]" disabled={isImageUploading}>{editingService ? "Update" : isImageUploading ? "Uploading..." : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search services" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                  const csv = ["name,category,price,is_active,is_featured,slug"].concat(
                    services.map((s) => `${JSON.stringify(s.name)},${JSON.stringify(s.category || "")},${s.price},${s.is_active},${s.is_featured},${JSON.stringify(s.slug || "")}`)
                  ).join("\n")
                  const blob = new Blob([csv], { type: "text/csv" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `services_${new Date().toISOString().slice(0,10)}.csv`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                }}>Export All</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{`Services (${filteredServices.length})`}</CardTitle>
          <CardDescription>Catalog services displayed to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((svc) => (
                <TableRow key={svc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        {svc.image ? (
                          <img src={svc.image || "/placeholder.svg"} alt={svc.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        {svc.is_featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{svc.category || "N/A"}</TableCell>
                  <TableCell>${svc.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={svc.is_active ? "default" : "secondary"}>{svc.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell>{new Date(svc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(svc)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(svc.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredServices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No services found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

