"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type SummaryLine = { label: string; value: string }

type FastTrackCheckoutModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  summary?: SummaryLine[]
  proceedLabel: string
  cancelLabel: string
  disabled?: boolean
  onProceed: () => Promise<void>
}

export default function FastTrackCheckoutModal({
  isOpen,
  onClose,
  title,
  description,
  summary,
  proceedLabel,
  cancelLabel,
  disabled,
  onProceed,
}: FastTrackCheckoutModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleProceed = async () => {
    if (disabled || submitting) return
    setSubmitting(true)
    try {
      await onProceed()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {description ? <p className="text-sm text-gray-600">{description}</p> : null}

          {summary && summary.length > 0 ? (
            <div className="rounded-lg border p-3 text-sm">
              <div className="space-y-2">
                {summary.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <span className="text-gray-600">{line.label}</span>
                    <span className="font-medium text-gray-900">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              {cancelLabel}
            </Button>
            <Button onClick={handleProceed} disabled={disabled || submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {proceedLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

