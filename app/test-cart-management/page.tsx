"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { Trash2, RefreshCw, ShoppingCart, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CartManagementPage() {
  const { items, itemCount, subtotal, clearCart, removeItem } = useDigitalCart()
  const { toast } = useToast()
  const [localStorageData, setLocalStorageData] = useState<string>('')
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // Check localStorage data
    if (typeof window !== 'undefined') {
      const cartData = localStorage.getItem('digitalCart')
      setLocalStorageData(cartData || 'No cart data in localStorage')
    }
  }, [items])

  const handleClearCart = async () => {
    setIsClearing(true)
    try {
      clearCart()
      
      // Also clear localStorage directly
      if (typeof window !== 'undefined') {
        localStorage.removeItem('digitalCart')
        setLocalStorageData('No cart data in localStorage')
      }
      
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your digital cart.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const handleRemoveItem = (itemId: string, itemName: string) => {
    try {
      removeItem(itemId)
      toast({
        title: "Item Removed",
        description: `${itemName} has been removed from your cart.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const refreshCartData = () => {
    if (typeof window !== 'undefined') {
      const cartData = localStorage.getItem('digitalCart')
      setLocalStorageData(cartData || 'No cart data in localStorage')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digital Cart Management</h1>
        <p className="text-gray-600">Manage and debug your digital cart contents</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cart Contents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart Contents ({itemCount} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.type}</Badge>
                        <span className="text-sm text-gray-500">${item.finalPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {item.id} | Product: {item.productId}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cart Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Quick Actions</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleClearCart}
                  disabled={isClearing || items.length === 0}
                  variant="destructive"
                  className="flex-1"
                >
                  {isClearing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear Cart
                </Button>
                <Button
                  onClick={refreshCartData}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Cart Statistics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">Items</div>
                  <div className="text-gray-600">{itemCount}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">Total</div>
                  <div className="text-gray-600">${subtotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">localStorage Data</h3>
              <div className="p-3 bg-gray-50 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {localStorageData}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Debug Info</h3>
              <div className="text-xs space-y-1">
                <div>Context Items: {items.length}</div>
                <div>Context Count: {itemCount}</div>
                <div>Context Subtotal: ${subtotal.toFixed(2)}</div>
                <div>localStorage Key: digitalCart</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Clear Cart:</strong> Removes all items from both the React state and localStorage</p>
            <p><strong>Remove Item:</strong> Removes individual items from the cart</p>
            <p><strong>Refresh:</strong> Updates the localStorage display to show current data</p>
            <p><strong>Debug Info:</strong> Shows the current state of the cart context and localStorage</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}