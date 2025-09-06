"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, FileImage, Package } from "lucide-react"

interface DeliveryMethodSelectorProps {
  product: {
    id: string
    name: string
    type: string
    previewUrl: string
  }
  onDownloadChoice: () => void
  onPrintChoice: () => void
}

export default function DeliveryMethodSelector({
  product,
  onDownloadChoice,
  onPrintChoice,
}: DeliveryMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"download" | "print" | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Delivery Method</h3>
        <p className="text-gray-600">How would you like to receive your AI-generated {product.type}?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Download Option */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === "download" ? "ring-2 ring-purple-500 bg-purple-50" : "hover:shadow-md"
          }`}
          onClick={() => setSelectedMethod("download")}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Digital Download</CardTitle>
            <CardDescription>Get instant access to your files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base Price:</span>
              <Badge variant="secondary">$4.99</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Included Formats:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  PNG
                </Badge>
                <Badge variant="outline" className="text-xs">
                  JPG
                </Badge>
                {product.type === "logo" && (
                  <Badge variant="outline" className="text-xs">
                    SVG
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FileImage className="h-3 w-3" />
                <span>High-resolution files</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>Instant download</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Multiple format options</span>
              </div>
            </div>

            {selectedMethod === "download" && (
              <Button onClick={onDownloadChoice} className="w-full bg-purple-600 hover:bg-purple-700">
                Add to Cart - Download
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Print Option */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedMethod === "print" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
          }`}
          onClick={() => setSelectedMethod("print")}
        >
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Printer className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Print Physical Product</CardTitle>
            <CardDescription>Get it printed on various materials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Starting at:</span>
              <Badge variant="secondary">$9.99</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Available Materials:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Paper
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Canvas
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Metal
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Acrylic
                </Badge>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Printer className="h-3 w-3" />
                <span>Professional printing</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Multiple size options</span>
              </div>
              <div className="flex items-center gap-1">
                <FileImage className="h-3 w-3" />
                <span>Premium materials</span>
              </div>
            </div>

            {selectedMethod === "print" && (
              <Button onClick={onPrintChoice} className="w-full bg-blue-600 hover:bg-blue-700">
                Configure Print Order
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!selectedMethod && <div className="text-center text-sm text-gray-500">Select a delivery method to continue</div>}
    </div>
  )
}
