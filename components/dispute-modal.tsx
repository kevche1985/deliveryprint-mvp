"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"

export default function DisputeModal({ open, onOpenChange, orderId, paymentProvider, captureId, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; orderId: string; paymentProvider?: string; captureId?: string; onCreated?: (d: any) => void }) {
  const { t } = useLanguage()
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
          <DialogTitle>{t("disputes.modalTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>{t("disputes.reason")}</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder={t("disputes.selectReason")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_received">{t("disputes.reasons.not_received")}</SelectItem>
              <SelectItem value="defective">{t("disputes.reasons.defective")}</SelectItem>
              <SelectItem value="not_as_described">{t("disputes.reasons.not_as_described")}</SelectItem>
              <SelectItem value="duplicate_charge">{t("disputes.reasons.duplicate_charge")}</SelectItem>
              <SelectItem value="other">{t("disputes.reasons.other")}</SelectItem>
            </SelectContent>
          </Select>
          <Label>{t("disputes.requestedAmount")}</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Label>{t("disputes.detailsLabel")}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading} className="bg-[#8B0000] hover:bg-[#6B0000]">{loading ? t("disputes.submitting") : t("disputes.submitDispute")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

