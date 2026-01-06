"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

export default function DisputeModal({ open, onOpenChange, orderId, paymentProvider, captureId, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; orderId: string; paymentProvider?: string; captureId?: string; onCreated?: (d: any) => void }) {
  const [reason, setReason] = useState("not_received")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    const res = await fetch("/api/disputes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, reason, description, amountRequested: Number(amount || 0), paymentProvider, paymentCaptureId: captureId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      onCreated?.(data.dispute)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Refund / Create Dispute</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_received">Product not received</SelectItem>
              <SelectItem value="defective">Defective or damaged</SelectItem>
              <SelectItem value="not_as_described">Not as described</SelectItem>
              <SelectItem value="duplicate_charge">Duplicate charge</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Label>Requested Amount (USD)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Label>Details</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading} className="bg-[#8B0000] hover:bg-[#6B0000]">{loading ? "Submitting..." : "Submit Dispute"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

