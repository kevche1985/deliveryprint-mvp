"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Edit, Flag, MessageSquareMore, Clock } from "lucide-react"

type ReviewStatus = "pending" | "in_review" | "approved" | "rejected"

type TranslationEntry = {
  key: string
  source: string // English
  target: string // Spanish (es-MX)
  status: ReviewStatus
  flags: string[]
  comments: { author: string; text: string; date: string }[]
  lastUpdated: string // ISO
  assignedTo?: string
}

const DAYS = 24 * 60 * 60 * 1000

function isOverdue(entry: TranslationEntry, days = 7): boolean {
  const last = new Date(entry.lastUpdated).getTime()
  return Date.now() - last > days * DAYS && (entry.status === "pending" || entry.status === "in_review")
}

function isSuspicious(entry: TranslationEntry): boolean {
  // Flags: missing, identical to source, TODO markers
  const t = (entry.target || "").trim()
  if (!t) return true
  if (t === entry.key) return true
  if (t.toLowerCase() === entry.source.trim().toLowerCase()) return true
  if (/\bTODO\b|\bTBD\b|\bFIXME\b/i.test(t)) return true
  return false
}

export default function AdminTranslationsPage() {
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all")
  const [editEntry, setEditEntry] = useState<TranslationEntry | null>(null)
  const [editText, setEditText] = useState("")
  const [commentText, setCommentText] = useState("")

  // Mock data: keys pulled from sample i18n files
  const [entries, setEntries] = useState<TranslationEntry[]>([
    {
      key: "home.title",
      source: "Print-On-Demand for your business",
      target: "Impresión bajo demanda para tu negocio",
      status: "in_review",
      flags: [],
      comments: [
        { author: "admin", text: "Check punctuation.", date: new Date(Date.now() - 9 * DAYS).toISOString() },
      ],
      lastUpdated: new Date(Date.now() - 9 * DAYS).toISOString(),
      assignedTo: "translator@example.com",
    },
    {
      key: "home.ctaShopNow",
      source: "Shop Now",
      target: "Comprar ahora",
      status: "approved",
      flags: [],
      comments: [],
      lastUpdated: new Date(Date.now() - 2 * DAYS).toISOString(),
    },
    {
      key: "product.config.title",
      source: "Configure your product",
      target: "Configura tu producto",
      status: "pending",
      flags: ["length-check"],
      comments: [],
      lastUpdated: new Date(Date.now() - 15 * DAYS).toISOString(),
      assignedTo: "localizer@example.com",
    },
    {
      key: "product.validation.required",
      source: "This field is required",
      target: "Este campo es obligatorio",
      status: "in_review",
      flags: [],
      comments: [],
      lastUpdated: new Date(Date.now() - 1 * DAYS).toISOString(),
    },
  ])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const overdue = useMemo(() => entries.filter(e => isOverdue(e)), [entries])

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchesSearch = !search || e.key.toLowerCase().includes(search.toLowerCase()) || e.source.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || e.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [entries, search, statusFilter])

  const openEdit = (entry: TranslationEntry) => {
    setEditEntry(entry)
    setEditText(entry.target)
  }

  const saveEdit = () => {
    if (!editEntry) return
    setEntries(prev => prev.map(e => e.key === editEntry.key ? { ...e, target: editText, status: e.status === "pending" ? "in_review" : e.status, lastUpdated: new Date().toISOString() } : e))
    setEditEntry(null)
    setEditText("")
  }

  const addComment = (entry: TranslationEntry) => {
    if (!commentText.trim()) return
    setEntries(prev => prev.map(e => e.key === entry.key ? { ...e, comments: [...e.comments, { author: "admin", text: commentText.trim(), date: new Date().toISOString() }], lastUpdated: new Date().toISOString() } : e))
    setCommentText("")
  }

  const flagEntry = (entry: TranslationEntry, flag: string) => {
    setEntries(prev => prev.map(e => e.key === entry.key ? { ...e, flags: Array.from(new Set([...(e.flags || []), flag])), lastUpdated: new Date().toISOString() } : e))
  }

  const setStatus = (entry: TranslationEntry, status: ReviewStatus) => {
    setEntries(prev => prev.map(e => e.key === entry.key ? { ...e, status, lastUpdated: new Date().toISOString() } : e))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Translation Review Dashboard
            {loading && <Loader2 className="animate-spin h-4 w-4 text-gray-500" />}
          </CardTitle>
          <CardDescription>
            Review, flag, and approve translations. Overdue items and suspicious strings are highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {overdue.length > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {overdue.length} item(s) overdue for review (older than 7 days). Please prioritize: {overdue.map(o => o.key).join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search by key or text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus | "all")}> 
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline">Total: {filtered.length}</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Source (en)</TableHead>
                <TableHead>Target (es-MX)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const suspicious = isSuspicious(entry)
                const overdueItem = isOverdue(entry)
                return (
                  <TableRow key={entry.key} className={suspicious ? "bg-red-50" : overdueItem ? "bg-yellow-50" : undefined}>
                    <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{entry.target || <span className="text-muted-foreground">(empty)</span>}</span>
                        {suspicious && (
                          <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Suspicious</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.status === "approved" && <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>}
                      {entry.status === "rejected" && <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>}
                      {entry.status === "in_review" && <Badge variant="outline">In Review</Badge>}
                      {entry.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.flags?.length ? entry.flags.map((f) => (
                          <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                        )) : <span className="text-muted-foreground text-xs">None</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(entry.lastUpdated).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(entry)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => flagEntry(entry, "needs-review")}>
                        <Flag className="h-3 w-3 mr-1" /> Flag
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(entry, "approved")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(entry, "rejected")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquareMore className="h-4 w-4" /> Comments & Collaboration</CardTitle>
          <CardDescription>Add reviewer notes and iterate on translations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Selected Entry</h4>
              {editEntry ? (
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-mono">{editEntry.key}</span></div>
                  <div className="text-sm text-muted-foreground">{editEntry.source}</div>
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment for translators/reviewers" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addComment(editEntry!)}>Add Comment</Button>
                    <Button variant="outline" size="sm" onClick={() => flagEntry(editEntry!, "inconsistent")}>Flag Inconsistency</Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {editEntry.comments.map((c, idx) => (
                      <div key={idx} className="text-xs p-2 border rounded">
                        <div className="font-medium">{c.author} • {new Date(c.date).toLocaleString()}</div>
                        <div>{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Select an entry to comment.</div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Guidelines</h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>Preserve placeholders and punctuation.</li>
                <li>Prefer natural LATAM Spanish (es-MX).</li>
                <li>Flag strings equal to English or with TODO markers.</li>
                <li>Resolve overdue items first.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
            <DialogDescription>Update the Spanish (es-MX) translation. Save moves status to "In Review" if pending.</DialogDescription>
          </DialogHeader>
          {editEntry && (
            <div className="space-y-3">
              <div className="text-xs font-mono">{editEntry.key}</div>
              <div className="text-sm text-muted-foreground">Source: {editEntry.source}</div>
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setEditEntry(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}