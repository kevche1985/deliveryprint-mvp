"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Trash2, Download, ArrowRight, Package, Shield } from "lucide-react"
import { useDigitalCart } from "@/lib/digital-cart-context"
import { useLanguage } from "@/lib/language-context"

export default function DigitalCartPage() {
  const { items, subtotal, updateItemFormats, updateItemLicense, removeItem, calculateItemPrice } = useDigitalCart()
  const { t } = useLanguage()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Digital Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add AI-generated products to your cart to get started</p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white">
              <Link href="/digital-products">
                Browse Digital Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Cart</h1>
          <p className="text-gray-600">Customize your AI-generated products before checkout</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.previewUrl || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-gray-500 capitalize">{item.type} • AI Generated</p>
                        <Badge variant="secondary" className="mt-1">
                          Base Price: ${item.basePrice.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Format Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-gray-600" />
                      <Label className="font-medium">Format Options</Label>
                    </div>
                    <div className="space-y-3">
                      {item.formatOptions.map((format) => (
                        <div key={format.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`format-${item.id}-${format.id}`}
                            checked={item.selectedFormats.includes(format.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateItemFormats(item.id, [...item.selectedFormats, format.id])
                              } else {
                                updateItemFormats(
                                  item.id,
                                  item.selectedFormats.filter((f) => f !== format.id),
                                )
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`format-${item.id}-${format.id}`} className="font-medium">
                              {format.name}
                              {format.included && (
                                <Badge variant="secondary" className="ml-2">
                                  Included
                                </Badge>
                              )}
                            </Label>
                            <p className="text-sm text-gray-500">{format.description}</p>
                          </div>
                          <span className="font-medium">
                            {format.price === 0 ? "Free" : `+$${format.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* License Selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <Label className="font-medium">License Options</Label>
                    </div>
                    <RadioGroup
                      value={item.selectedLicense}
                      onValueChange={(value) => updateItemLicense(item.id, value)}
                    >
                      {item.licenseOptions.map((license) => (
                        <div key={license.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={license.id} id={`license-${item.id}-${license.id}`} />
                          <div className="flex-1">
                            <Label htmlFor={`license-${item.id}-${license.id}`} className="font-medium">
                              {license.name}
                              {license.included && (
                                <Badge variant="secondary" className="ml-2">
                                  Included
                                </Badge>
                              )}
                            </Label>
                            <p className="text-sm text-gray-500">{license.description}</p>
                          </div>
                          <span className="font-medium">
                            {license.price === 0 ? "Free" : `+$${license.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item Total:</span>
                    <span className="text-lg font-bold">${calculateItemPrice(item).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate">{item.name}</span>
                      <span>${calculateItemPrice(item).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
                  >
                    <Link href="/checkout">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full">
                    <Link href="/digital-products">Continue Shopping</Link>
                  </Button>
                </div>

                <div className="pt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-3 w-3" />
                    <span>Instant download after payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>7-day download guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
