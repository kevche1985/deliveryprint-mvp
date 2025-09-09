"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import DesignEditor from "./design-editor"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Use any types to avoid conflicts with design-editor internal types
interface DesignServiceEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (output: any) => void
  productImage: string
  initialDesign?: any
  productName: string
  product?: any
  variants?: any[]
  selectedVariant?: string
}

// Add named export
export { default as DesignServiceEditor } from './design-service-editor'

export default function DesignServiceEditor({
  isOpen,
  onClose,
  onSave,
  productImage,
  initialDesign,
  productName,
  product,
  variants = [],
  selectedVariant,
}: DesignServiceEditorProps) {
  const [designData, setDesignData] = useState<any>(null)

  const handleSave = (output: any) => {
    setDesignData(output)
    sessionStorage.setItem("pendingDesignForService", JSON.stringify(output))
    if (onSave) {
      onSave(output)
    }
    onClose() // Close the modal after saving
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] h-[90vh] max-w-none max-h-none p-0 bg-white flex flex-col rounded-lg shadow-2xl border overflow-hidden">
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
            product={product}
            variants={variants}
            selectedVariant={selectedVariant}
          />
        </div>
        
        {/* Design Confirmation Footer */}
         <div className="border-t bg-gray-50 px-4 py-2 flex justify-between items-center shrink-0">
           <div className="text-xs text-gray-600">
             Complete before confirming
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={onClose}>
               Cancel
             </Button>
             <Button 
               size="sm"
               onClick={() => {
                 // Trigger save from the design editor
                 const saveButton = document.querySelector('[data-save-design]') as HTMLButtonElement
                 if (saveButton) {
                   saveButton.click()
                 } else {
                   onClose()
                 }
               }}
               className="bg-red-600 hover:bg-red-700 text-white"
             >
               Confirm Design
             </Button>
           </div>
         </div>
      </DialogContent>
    </Dialog>
  )
}
