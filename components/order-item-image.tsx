'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Eye, Printer } from 'lucide-react'
import { getOrderItemImageUrl, getOperatorPrintImage, getImageTypeLabel } from '@/lib/image-utils'
import { OrderItem } from '@/lib/database'

interface OrderItemImageProps {
  item: OrderItem
  showOperatorTools?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function OrderItemImage({ 
  item, 
  showOperatorTools = false, 
  size = 'medium' 
}: OrderItemImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const displayImageUrl = getOrderItemImageUrl(item)
  const printImageUrl = getOperatorPrintImage(item)
  const imageTypeLabel = getImageTypeLabel(item)
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  }
  
  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }
  
  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }
  
  const handleDownloadPrintFile = async () => {
    if (printImageUrl && !printImageUrl.includes('placeholder-print.svg')) {
      try {
        const response = await fetch(printImageUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `print-${item.id}.${printImageUrl.split('.').pop()}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Download failed:', error)
      }
    }
  }
  
  return (
    <div className="relative group">
      {/* Main Image Display */}
      <Dialog>
        <DialogTrigger asChild>
          <div className={`${sizeClasses[size]} relative cursor-pointer border rounded-lg overflow-hidden bg-gray-100 hover:shadow-md transition-shadow`}>
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            
            {!imageError ? (
              <Image
                src={displayImageUrl}
                alt={item.name || 'Product image'}
                fill
                className="object-cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 80px, 160px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Eye className="h-6 w-6" />
              </div>
            )}
            
            {/* Image Type Badge */}
            {imageTypeLabel && (
              <div className="absolute top-1 right-1">
                <Badge 
                  variant={imageTypeLabel === 'Custom' ? 'secondary' : 'outline'} 
                  className="text-xs px-1 py-0"
                >
                  {imageTypeLabel}
                </Badge>
              </div>
            )}
          </div>
        </DialogTrigger>
        
        {/* Large Image Modal */}
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="relative w-full h-96">
              <Image
                src={displayImageUrl}
                alt={item.name || 'Product image'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              
              {showOperatorTools && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPrintFile}
                    disabled={printImageUrl.includes('placeholder-print.svg')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Print File
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(printImageUrl, '_blank')}
                    disabled={printImageUrl.includes('placeholder-print.svg')}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    View Print
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Operator Quick Actions */}
      {showOperatorTools && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0 rounded-full"
            onClick={handleDownloadPrintFile}
            disabled={printImageUrl.includes('placeholder-print.svg')}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}