'use client'

import { OrderItem } from '@/lib/database'
import OrderItemImage from './order-item-image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { hasPrintFiles } from '@/lib/image-utils'

interface OrderItemsListProps {
  items: OrderItem[]
  showOperatorTools?: boolean
}

export default function OrderItemsList({ items, showOperatorTools = false }: OrderItemsListProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No items found for this order</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id}>
          <div className="flex gap-4 p-4 border rounded-lg">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <OrderItemImage 
                item={item} 
                showOperatorTools={showOperatorTools}
                size="medium"
              />
            </div>
            
            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  
                  {/* Item Type Badges */}
                  <div className="flex gap-2 mt-2">
                    {item.digital_product_id && (
                      <Badge variant="secondary">Digital Product</Badge>
                    )}
                    {item.design_id && (
                      <Badge variant="outline">Custom Design</Badge>
                    )}
                    {item.variant_id && (
                      <Badge variant="outline">Variant</Badge>
                    )}
                  </div>
                  
                  {/* Customization Details */}
                  {item.customizations && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Customizations applied</p>
                    </div>
                  )}
                </div>
                
                {/* Price and Quantity */}
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${(item.price || 0).toFixed(2)} × {item.quantity || 1}
                  </p>
                </div>
              </div>
              
              {/* Operator Information */}
              {showOperatorTools && (
                <div className="mt-3 p-3 bg-blue-50 rounded border">
                  <h4 className="font-medium text-blue-900 mb-2">Production Notes:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Print File:</span>
                      <span className={item.print_ready_file_url ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                        {item.print_ready_file_url ? 'Available' : 'Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Design File:</span>
                      <span className={item.design_file_url ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                        {item.design_file_url ? 'Available' : 'Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Custom Image:</span>
                      <span className={item.customized_image_url ? 'text-green-600 ml-1' : 'text-gray-500 ml-1'}>
                        {item.customized_image_url ? 'Available' : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Print Ready:</span>
                      <span className={hasPrintFiles(item) ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                        {hasPrintFiles(item) ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {index < items.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}