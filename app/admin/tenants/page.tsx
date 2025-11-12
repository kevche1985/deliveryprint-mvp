"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getTenantBySlug, type Tenant, getUserProfile } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminTenantsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [tenants, setTenants] = useState<Tenant[]>([])

  // Form state
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [brandBgColor, setBrandBgColor] = useState("#ffffff")
  const [brandUiColor, setBrandUiColor] = useState("#000000")
  const [emailFrom, setEmailFrom] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setUserRole(null)
        setLoading(false)
        return
      }
      const profile = await getUserProfile(user.id)
      setUserRole(profile?.role ?? null)

      // Load existing tenants
      const { data: tenantList, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("Error loading tenants:", error)
      } else {
        setTenants(tenantList as Tenant[])
      }
      setLoading(false)
    }
    init()
  }, [])

async function uploadLogo(file: File, slugForPath: string) {
  try {
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("slug", slugForPath)
    const res = await fetch("/api/admin/tenants/upload-logo", { method: "POST", body: fd })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json?.error || "Failed to upload logo")
    }
    setLogoUrl(json.url)
    toast({ title: "Logo uploaded", description: "The logo was uploaded successfully." })
  } catch (err: any) {
    console.error("Logo upload failed:", err)
    toast({ title: "Logo upload failed", description: err.message || String(err) })
  } finally {
    setUploadingLogo(false)
  }
}

function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0] || null
  setLogoFile(file)
  if (!file) return
  const normalizedSlug = slug.trim().toLowerCase().replace(/_/g, "-") || "primary"
  uploadLogo(file, normalizedSlug)
}
  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault()

    // Basic validation
    const normalizedSlug = slug.trim().toLowerCase().replace(/_/g, "-")
    if (!normalizedSlug || !/^[a-z0-9-]+$/.test(normalizedSlug)) {
      toast({ title: "Invalid slug", description: "Use lowercase letters, numbers, and hyphens only." })
      return
    }
    if (!name.trim()) {
      toast({ title: "Name is required", description: "Please provide a name for the tenant." })
      return
    }

    setLoading(true)

    // Check uniqueness client-side to provide fast feedback (DB also enforces uniqueness)
    const { count } = await supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("slug", normalizedSlug)

    if ((count ?? 0) > 0) {
      toast({ title: "Slug already exists", description: `The slug '${normalizedSlug}' is already in use.` })
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: normalizedSlug,
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          brand_bg_color: brandBgColor || null,
          brand_ui_color: brandUiColor || null,
          email_from: emailFrom.trim() || null,
        }),
      })

      let json: any
      try {
        json = await res.json()
      } catch (parseErr) {
        const text = await res.text()
        json = { error: text || res.statusText || "Unknown error" }
      }

      if (!res.ok) {
        console.error("Error creating tenant:", json)
        const desc = [
          json?.error || `HTTP ${res.status}`,
          json?.code ? `(code: ${json.code})` : null,
          json?.details ? `details: ${json.details}` : null,
          json?.hint ? `hint: ${json.hint}` : null,
        ]
          .filter(Boolean)
          .join(" | ")
        toast({ title: "Creation failed", description: desc })
        setLoading(false)
        return
      }

      const created = json.tenant as Tenant
      toast({ title: "Tenant created", description: `Tenant '${created.name}' was created successfully.` })

      // Update list
      setTenants([created, ...tenants])
    } catch (err: any) {
      console.error("Error creating tenant (network):", err)
      toast({ title: "Creation failed", description: err.message || String(err) })
      setLoading(false)
      return
    }
    // Update list
    setTenants([created, ...tenants])

    // Optionally clear form
    setSlug("")
    setName("")
    setLogoUrl("")
    setBrandBgColor("#ffffff")
    setBrandUiColor("#000000")
    setEmailFrom("")

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    )
  }

  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not authorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be an admin to manage tenants.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenant Management</h1>
        <Button asChild variant="secondary">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Tenant Instance</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateTenant}>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., my-brand"
              />
              <p className="text-xs text-gray-500 mt-1">Lowercase, numbers, and hyphens only</p>
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tenant name" />
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              <div className="mt-2 flex items-center gap-2">
                <Input id="logoFile" type="file" accept="image/*" onChange={handleLogoFileChange} />
                {uploadingLogo && <span className="text-xs text-gray-500">Uploading...</span>}
              </div>
              {logoUrl && (
                <div className="mt-2">
                  <img src={logoUrl} alt="Logo preview" className="h-10" onError={(e) => { e.currentTarget.style.display = "none" }} />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="emailFrom">Email From</Label>
              <Input id="emailFrom" type="email" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} placeholder="hello@mybrand.com" />
            </div>

            <div>
              <Label htmlFor="brandBgColor">Brand Background Color</Label>
              <Input id="brandBgColor" type="color" value={brandBgColor} onChange={(e) => setBrandBgColor(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="brandUiColor">Brand UI Accent Color</Label>
              <Input id="brandUiColor" type="color" value={brandUiColor} onChange={(e) => setBrandUiColor(e.target.value)} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <Button type="submit">Create Tenant</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-gray-600">No tenants found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Brand Colors</TableHead>
                  <TableHead>Email From</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>
                      <code>{t.slug}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: t.brand_bg_color ?? "transparent" }} />
                        <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: t.brand_ui_color ?? "transparent" }} />
                      </div>
                    </TableCell>
                    <TableCell>{t.email_from ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/t/${t.slug}/products`}>View</Link>
                        </Button>
                        {/* Future: edit/delete actions */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}