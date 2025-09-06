"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import DesignEditor, { type DesignOutputData, type DesignElement } from "./design-editor"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DesignServiceEditorProps {
  isOpen: boolean
  onClose: () => void
  productImage: string
  initialDesign?: {
    elements: DesignElement[]
    zoom: number
    productImage: string
  } | null
  productName: string
}

// Add named export
export { default as DesignServiceEditor } from './design-service-editor'

export default function DesignServiceEditor({
  isOpen,
  onClose,
  productImage,
  initialDesign,
  productName,
}: DesignServiceEditorProps) {
  const [designData, setDesignData] = useState<DesignOutputData | null>(null)

  const handleSave = (output: DesignOutputData) => {
    setDesignData(output)
    sessionStorage.setItem("pendingDesignForService", JSON.stringify(output))
    onClose() // Close the modal after saving
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1280px] h-[1050px] max-w-none max-h-none p-0 bg-white flex flex-col rounded-lg shadow-2xl border">
        <div className="absolute top-2 right-2 z-50">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X className="h-6 w-6" />
            <span className="sr-only">Close editor</span>
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DesignEditor
            productImage={productImage}
            onSave={handleSave}
            onCancel={onClose}
            initialDesign={initialDesign}
            productName={productName}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
