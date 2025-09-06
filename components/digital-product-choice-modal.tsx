"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Printer, ArrowRight, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

interface DigitalProductChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    type: string
    previewUrl: string
    designId: string
    generationInputs: any
  }
  onDownloadChoice: () => void
}

export default function DigitalProductChoiceModal({
  isOpen,
  onClose,
  product,
  onDownloadChoice,
}: DigitalProductChoiceModalProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownloadChoice = () => {
    setIsProcessing(true)
    onDownloadChoice()
    onClose()
    // Redirect to checkout
    setTimeout(() => {
      router.push("/checkout")
      setIsProcessing(false)
    }, 500)
  }

  const handlePrintChoice = () => {
    setIsProcessing(true)
    onClose()

    // Store the design data in sessionStorage for the printing service
    const designData = {
      id: product.designId,
      name: product.name,
      type: product.type,
      previewUrl: product.previewUrl,
      generationInputs: product.generationInputs,
      timestamp: Date.now(),
    }

    sessionStorage.setItem("pendingDesignForPrint", JSON.stringify(designData))

    // Redirect to digital printing services
    setTimeout(() => {
      router.push("/services/digital-printing?design=ai-generated")
      setIsProcessing(false)
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose Your Delivery Option</DialogTitle>
          <DialogDescription>How would you like to receive your AI-generated {product.type}?</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Download Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Digital Download</CardTitle>
              <CardDescription>Get instant access to your files after payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>• Multiple formats</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Instant delivery</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Commercial license options</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• No shipping costs</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
              </div>

              <Button
                onClick={handleDownloadChoice}
                disabled={isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue to Checkout
              </Button>
            </CardContent>
          </Card>

          {/* Print Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Printer className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-lg">Professional Printing</CardTitle>
              <CardDescription>Get your design professionally printed and delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>• Premium materials</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Multiple sizes</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Professional quality</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Fast delivery</span>
                  <span className="text-green-600 font-medium">✓</span>
                </div>
              </div>

              <Button
                onClick={handlePrintChoice}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Go to Print Services
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <img
              src={product.previewUrl || "/placeholder.svg"}
              alt={product.name}
              className="w-16 h-16 object-cover rounded border"
            />
            <div>
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-gray-500 capitalize">{product.type} • AI Generated</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
