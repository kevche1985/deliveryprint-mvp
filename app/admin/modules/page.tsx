"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

type ModuleRow = { key: string; label: string; path: string }

export default function AdminModulesPage() {
  const { toast } = useToast()
  const [adminModules, setAdminModules] = useState<ModuleRow[]>([])
  const [webModules, setWebModules] = useState<ModuleRow[]>([])
  const [adminVisibility, setAdminVisibility] = useState<Record<string, boolean>>({})
  const [webVisibility, setWebVisibility] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        const resp = await fetch("/api/admin/modules", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json.error || "Failed to load modules")
        setAdminModules(json?.modules?.admin || [])
        setWebModules(json?.modules?.web || [])
        setAdminVisibility(json?.visibility?.admin || {})
        setWebVisibility(json?.visibility?.web || {})
      } catch (e: any) {
        toast({ title: "Load failed", description: e.message, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const onToggleAdmin = (key: string, val: boolean) => setAdminVisibility((v) => ({ ...v, [key]: val }))
  const onToggleWeb = (key: string, val: boolean) => setWebVisibility((v) => ({ ...v, [key]: val }))

  const onSave = async () => {
    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      const resp = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ adminVisibility, webVisibility }),
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(json.error || "Failed to save")
      toast({ title: "Saved", description: "Module visibility saved" })
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Modules</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading &&
                adminModules.map((m) => (
                  <TableRow key={m.key}>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>{m.path}</TableCell>
                    <TableCell className="text-right">
                      <Switch checked={adminVisibility[m.key] !== false} onCheckedChange={(v) => onToggleAdmin(m.key, v)} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Web Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading &&
                webModules.map((m) => (
                  <TableRow key={m.key}>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>{m.path}</TableCell>
                    <TableCell className="text-right">
                      <Switch checked={webVisibility[m.key] !== false} onCheckedChange={(v) => onToggleWeb(m.key, v)} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <Button onClick={onSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
