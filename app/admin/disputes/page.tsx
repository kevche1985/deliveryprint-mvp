"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

export default function AdminDisputesPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const [newMessages, setNewMessages] = useState<Record<string, string>>({})
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [selectedFileNames, setSelectedFileNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false })
      const base = data || []
      const enriched = await Promise.all(
        base.map(async (d) => {
          const [{ data: comments }, { data: files }] = await Promise.all([
            supabase.from("dispute_comments").select("*").eq("dispute_id", d.id).order("created_at", { ascending: true }),
            supabase.from("dispute_files").select("*").eq("dispute_id", d.id).order("created_at", { ascending: false }),
          ])
          return { ...d, comments: comments || [], files: files || [] }
        })
      )
      setItems(enriched)
      setLoading(false)
    }
    load()
  }, [user])

  const updateStatus = async (id: string, status: string) => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    await fetch(`/api/disputes/${id}/update`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, resolution: resolutions[id] || null }) })
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false })
    const base = data || []
    const enriched = await Promise.all(
      base.map(async (d) => {
        const [{ data: comments }, { data: files }] = await Promise.all([
          supabase.from("dispute_comments").select("*").eq("dispute_id", d.id).order("created_at", { ascending: true }),
          supabase.from("dispute_files").select("*").eq("dispute_id", d.id).order("created_at", { ascending: false }),
        ])
        return { ...d, comments: comments || [], files: files || [] }
      })
    )
    setItems(enriched)
  }

  const refund = async (id: string) => {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    await fetch(`/api/disputes/${id}/refund`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
    const { data } = await supabase.from("disputes").select("*").order("created_at", { ascending: false })
    const base = data || []
    const enriched = await Promise.all(
      base.map(async (d) => {
        const [{ data: comments }, { data: files }] = await Promise.all([
          supabase.from("dispute_comments").select("*").eq("dispute_id", d.id).order("created_at", { ascending: true }),
          supabase.from("dispute_files").select("*").eq("dispute_id", d.id).order("created_at", { ascending: false }),
        ])
        return { ...d, comments: comments || [], files: files || [] }
      })
    )
    setItems(enriched)
  }

  const sendMessage = async (id: string) => {
    const text = newMessages[id]
    if (!text || !text.trim()) return
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const resp = await fetch(`/api/disputes/${id}/message`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: text }) })
    if (resp.ok) {
      const { comment } = await resp.json()
      setItems((prev) => prev.map((d) => (d.id === id ? { ...d, comments: [...(d.comments || []), comment] } : d)))
      setNewMessages((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const uploadFile = async (id: string, file: File) => {
    if (!file) return
    setUploadingFor(id)
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const form = new FormData()
    form.append("file", file)
    const resp = await fetch(`/api/disputes/${id}/files/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form })
    setUploadingFor(null)
    if (resp.ok) {
      const { file: saved } = await resp.json()
      setItems((prev) => prev.map((d) => (d.id === id ? { ...d, files: [saved, ...(d.files || [])] } : d)))
      setSelectedFileNames((prev) => ({ ...prev, [id]: "" }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("disputes.title")}</CardTitle>
          <CardDescription>Revisar, solicitar información, aprobar o cancelar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : items.length === 0 ? (
            <div>{t("disputes.title")}: 0</div>
          ) : (
            <div className="space-y-3">
              {items.map((d) => (
                <div key={d.id} className="border p-3 rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">Pedido {d.order_id}</div>
                      <div className="text-sm">{t("disputes.reason")} {d.reason}</div>
                      <div className="text-sm">Monto solicitado: ${Number(d.amount_requested || 0).toFixed(2)}</div>
                    </div>
                    <Badge>{d.status}</Badge>
                  </div>
                  <div className="mt-2">
                    <label className="text-sm font-medium">{t("disputes.resolution")}</label>
                    <textarea className="w-full border rounded p-2 text-sm" value={resolutions[d.id] || ''} onChange={(e) => setResolutions((prev) => ({ ...prev, [d.id]: e.target.value }))} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold mb-2">{t("disputes.messages")}</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(d.comments || []).length === 0 ? (
                          <div className="text-sm text-gray-500">{t("disputes.noMessages")}</div>
                        ) : (
                          d.comments.map((c: any) => (
                            <div key={c.id} className="border rounded p-2 text-sm">
                              <div>{c.comment}</div>
                              <div className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 items-center">
                        <input className="flex-1 border rounded p-2 text-sm" placeholder={t("disputes.writeMessage")} value={newMessages[d.id] || ''} onChange={(e) => setNewMessages((prev) => ({ ...prev, [d.id]: e.target.value }))} />
                        <Button variant="outline" onClick={() => sendMessage(d.id)}>{t("disputes.send")}</Button>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">{t("disputes.attachments")}</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(d.files || []).length === 0 ? (
                          <div className="text-sm text-gray-500">{t("disputes.noAttachments")}</div>
                        ) : (
                          d.files.map((f: any) => (
                            <div key={f.id} className="flex items-center gap-2 border rounded p-2">
                              <img src={f.path} alt={f.filename} className="w-12 h-12 object-cover rounded" />
                              <div className="text-xs">{f.filename}</div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 justify-center items-center">
                        <input id={`file-${d.id}`} type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedFileNames((prev) => ({ ...prev, [d.id]: file.name })); uploadFile(d.id, file) } }} />
                        <Button className="bg-[#8B0000] hover:bg-[#6B0000]" onClick={() => document.getElementById(`file-${d.id}`)?.click()}>{t("disputes.chooseFile")}</Button>
                        {selectedFileNames[d.id] && <span className="text-xs">{selectedFileNames[d.id]}</span>}
                        {uploadingFor === d.id && <span className="text-xs text-gray-500">{t("disputes.uploading")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => updateStatus(d.id, "needs_info")}>{"Solicitar información"}</Button>
                    <Button variant="outline" onClick={() => updateStatus(d.id, "accepted")}>{"Aceptar"}</Button>
                    <Button variant="outline" onClick={() => updateStatus(d.id, "denied")}>{"Denegar"}</Button>
                    <Button onClick={() => refund(d.id)} className="bg-[#8B0000] hover:bg-[#6B0000]">{"Reembolsar"}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
