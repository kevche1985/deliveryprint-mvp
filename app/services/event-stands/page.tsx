"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { QuoteRequestModal } from "@/components/quote-request-modal"
import { DesignServiceEditor } from "@/components/design-service-editor"
import { ShoppingCart, Palette, FileText, Star, Truck, Shield, Clock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const eventStandProducts = [
  {
    id: "popup-stands",
    name: "Pop-up Stands",
    description: "Portable and easy-to-setup display stands perfect for trade shows and events",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Pop-up%20Stands.jpg",
    basePrice: 299,
    categoryKey: "displayStands",
    sizes: [
      { name: "8ft Straight", price: 299, dimensions: "8ft W x 7.5ft H" },
      { name: "10ft Straight", price: 399, dimensions: "10ft W x 7.5ft H" },
      { name: "8ft Curved", price: 349, dimensions: "8ft W x 7.5ft H" },
      { name: "10ft Curved", price: 449, dimensions: "10ft W x 7.5ft H" },
    ],
    features: [
      "Tool-free assembly",
      "Lightweight aluminum frame",
      "Carrying case included",
      "Wrinkle-resistant fabric",
    ],
    category: "Display Stands",
  },
  {
    id: "banner-stands",
    name: "Banner Stands",
    description: "Retractable banner stands for professional presentations and marketing displays",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Banner%20Stands.jpg",
    basePrice: 89,
    categoryKey: "bannerDisplays",
    sizes: [
      { name: '33" x 79"', price: 89, dimensions: '33" W x 79" H' },
      { name: '39" x 79"', price: 109, dimensions: '39" W x 79" H' },
      { name: '47" x 79"', price: 129, dimensions: '47" W x 79" H' },
      { name: 'Premium 33" x 79"', price: 149, dimensions: '33" W x 79" H' },
    ],
    features: ["Retractable mechanism", "Adjustable height", "Padded carrying case", "Easy graphic change"],
    category: "Banner Displays",
  },
  {
    id: "trade-show-displays",
    name: "Trade Show Displays",
    description: "Complete trade show booth solutions with modular components",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Trade%20Show%20Displays.jpg",
    basePrice: 899,
    categoryKey: "tradeShow",
    sizes: [
      { name: "10ft x 10ft Booth", price: 899, dimensions: "10ft W x 10ft D x 8ft H" },
      { name: "10ft x 20ft Booth", price: 1599, dimensions: "10ft W x 20ft D x 8ft H" },
      { name: "20ft x 20ft Booth", price: 2899, dimensions: "20ft W x 20ft D x 8ft H" },
      { name: "Custom Size", price: 0, dimensions: "Contact for quote" },
    ],
    features: ["Modular design", "LED lighting options", "Storage compartments", "Professional setup"],
    category: "Trade Show",
  },
  {
    id: "backdrop-stands",
    name: "Backdrop Stands",
    description: "Step and repeat backdrops perfect for events, photo ops, and branding",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Backdrop%20Stands.jpg",
    basePrice: 199,
    categoryKey: "eventBackdrops",
    sizes: [
      { name: "8ft x 8ft", price: 199, dimensions: "8ft W x 8ft H" },
      { name: "8ft x 10ft", price: 249, dimensions: "8ft W x 10ft H" },
      { name: "10ft x 8ft", price: 269, dimensions: "10ft W x 8ft H" },
      { name: "10ft x 10ft", price: 319, dimensions: "10ft W x 10ft H" },
    ],
    features: ["Telescopic frame", "Wrinkle-free fabric", "Easy assembly", "Portable carrying case"],
    category: "Event Backdrops",
  },
  /*
  {
    id: "table-covers-6ft",
    name: "6ft Table Covers",
    description: "Professional table covers for 6-foot tables with custom printing",
    image: "/placeholder.svg?height=300&width=400",
    basePrice: 79,
    sizes: [
      { name: "6ft Fitted", price: 79, dimensions: "72\" W x 30\" D x 30\" H" },
      { name: "6ft Stretch", price: 89, dimensions: "72\" W x 30\" D x 30\" H" },
      { name: "6ft Throw", price: 69, dimensions: "90\" W x 132\" L" },
    ],
    features: ["Machine washable", "Wrinkle resistant", "Flame retardant", "Custom printing"],
    category: "Table Covers",
  },
  {
    id: "table-covers-8ft",
    name: "8ft Table Covers",
    description: "Professional table covers for 8-foot tables with custom printing",
    image: "/placeholder.svg?height=300&width=400",
    basePrice: 89,
    sizes: [
      { name: "8ft Fitted", price: 89, dimensions: "96\" W x 30\" D x 30\" H" },
      { name: "8ft Stretch", price: 99, dimensions: "96\" W x 30\" D x 30\" H" },
      { name: "8ft Throw", price: 79, dimensions: "90\" W x 156\" L" },
    ],
    features: ["Machine washable", "Wrinkle resistant", "Flame retardant", "Custom printing"],
    category: "Table Covers",
  },
  */
]

export default function EventStandsPage() {
  const { t } = useLanguage()
  const [selectedProduct, setSelectedProduct] = useState(eventStandProducts[0])
  const [selectedSize, setSelectedSize] = useState(eventStandProducts[0].sizes[0])
  const [quantity, setQuantity] = useState(1)
  const [customizations, setCustomizations] = useState({
    designFile: null as File | null,
    designNotes: "",
    rushOrder: false,
  })
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showDesignEditor, setShowDesignEditor] = useState(false)

  const { addItem } = useCart()
  const { toast } = useToast()

  const handleProductChange = (productId: string) => {
    const product = eventStandProducts.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setSelectedSize(product.sizes[0])
    }
  }

  const handleSizeChange = (sizeIndex: string) => {
    const size = selectedProduct.sizes[Number.parseInt(sizeIndex)]
    if (size) {
      setSelectedSize(size)
    }
  }

  const calculateTotal = () => {
    const baseTotal = selectedSize.price * quantity
    const rushFee = customizations.rushOrder ? baseTotal * 0.5 : 0
    return baseTotal + rushFee
  }

  const handleAddToCart = () => {
    const unitPriceWithRush = selectedSize.price + (customizations.rushOrder ? selectedSize.price * 0.5 : 0)

    const cartItem = {
      productId: `event-stands-${selectedProduct.id}`,
      variantId: `${selectedProduct.id}-${selectedSize.name}`,
      designId: undefined,
      name: `${selectedProduct.name} - ${selectedSize.name}`,
      price: unitPriceWithRush,
      quantity,
      image: selectedProduct.image || "/placeholder.svg?height=200&width=300",
      customizations: {
        product: selectedProduct,
        size: selectedSize.name,
        dimensions: selectedSize.dimensions,
        designNotes: customizations.designNotes,
        rushOrder: customizations.rushOrder,
        designFile: customizations.designFile?.name,
      },
    }

    addItem(cartItem)
    toast({
      title: t("common.toast.addedToCartTitle"),
      description: `${cartItem.name} ${t("common.toast.addedToCartDescSuffix")}`,
    })
  }

  const handleCustomDesign = () => {
    setShowDesignEditor(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t("services.eventStandsPage.headerTitle")}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t("services.eventStandsPage.headerSubtitle")}
        </p>
        <div className="flex justify-center items-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-green-600" />
            <span className="text-sm">{t("services.eventStandsPage.badges.freeShipping")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm">{t("services.eventStandsPage.badges.quickTurnaround")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span className="text-sm">{t("services.eventStandsPage.badges.qualityGuarantee")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("services.eventStandsPage.selectStandTitle")}</CardTitle>
              <CardDescription>{t("services.eventStandsPage.selectStandDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-4">
                <Label>{t("services.eventStandsPage.productType")}</Label>
                <div className="grid grid-cols-1 gap-3">
                  {eventStandProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProduct.id === product.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleProductChange(product.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={t(`services.eventStandsPage.products.${product.id}.name`)}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{t(`services.eventStandsPage.products.${product.id}.name`)}</h3>
                          <p className="text-sm text-gray-600 mt-1">{t(`services.eventStandsPage.products.${product.id}.description`)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{t(`services.eventStandsPage.categories.${product.categoryKey}`)}</Badge>
                            <span className="font-semibold text-red-600">{t("common.from")} ${product.basePrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3">
                <Label>{t("services.eventStandsPage.sizeConfig")}</Label>
                <Select value={selectedProduct.sizes.indexOf(selectedSize).toString()} onValueChange={handleSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct.sizes.map((size, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{size.name}</span>
                          <span className="ml-4 font-semibold">{size.price > 0 ? `$${size.price}` : t("common.quote")}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">{t("services.eventStandsPage.dimensions")} {selectedSize.dimensions}</p>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <Label>{t("services.eventStandsPage.quantity")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-24"
                />
              </div>

              {/* Design Notes */}
              <div className="space-y-3">
                <Label>{t("services.eventStandsPage.designRequirements")}</Label>
                <Textarea
                  placeholder={t("services.eventStandsPage.designRequirementsPlaceholder")}
                  value={customizations.designNotes}
                  onChange={(e) => setCustomizations({ ...customizations, designNotes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Rush Order */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rushOrder"
                  checked={customizations.rushOrder}
                  onChange={(e) => setCustomizations({ ...customizations, rushOrder: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="rushOrder">{t("services.eventStandsPage.rushOrderLabel")}</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Preview & Actions */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <img
                src={selectedProduct.image || "/placeholder.svg"}
                alt={t(`services.eventStandsPage.products.${selectedProduct.id}.name`)}
                className="w-full h-64 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=256&width=400"
                }}
              />
              <h2 className="text-2xl font-bold mb-2">{t(`services.eventStandsPage.products.${selectedProduct.id}.name`)}</h2>
              <p className="text-gray-600 mb-4">{t(`services.eventStandsPage.products.${selectedProduct.id}.description`)}</p>

              {/* Features */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t("services.eventStandsPage.featuresLabel")}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {selectedProduct.features.map((_, index) => (
                    <li key={index}>{t(`services.eventStandsPage.products.${selectedProduct.id}.features.item${index + 1}`)}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("services.eventStandsPage.orderSummaryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("services.eventStandsPage.basePrice")} ({selectedSize.name})</span>
                  <span>${selectedSize.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("services.eventStandsPage.quantity")}</span>
                  <span>×{quantity}</span>
                </div>
                {customizations.rushOrder && (
                  <div className="flex justify-between text-orange-600">
                    <span>{t("services.eventStandsPage.rushOrderFee")}</span>
                    <span>+${(selectedSize.price * quantity * 0.5).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("services.eventStandsPage.total")}</span>
                    <span className="text-red-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedSize.price > 0 ? (
                  <>
                    <Button onClick={handleAddToCart} className="w-full bg-red-600 hover:bg-red-700">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("services.eventStandsPage.buttons.addToCart")}
                    </Button>
                    <Button onClick={handleCustomDesign} variant="outline" className="w-full bg-transparent">
                      <Palette className="h-4 w-4 mr-2" />
                      {t("services.eventStandsPage.buttons.customizeDesign")}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowQuoteModal(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("services.eventStandsPage.buttons.getCustomQuote")}
                  </Button>
                )}
              </div>

              <div className="text-center">
                <Button onClick={() => setShowQuoteModal(true)} variant="ghost" className="text-sm">
                  {t("services.eventStandsPage.buttons.needHelpQuote")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                {t("services.page.whyChooseTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {t("services.eventStandsPage.whyChooseList.item1")}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {t("services.eventStandsPage.whyChooseList.item2")}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {t("services.eventStandsPage.whyChooseList.item3")}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {t("services.eventStandsPage.whyChooseList.item4")}
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {t("services.eventStandsPage.whyChooseList.item5")}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quote Modal */}
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        serviceType={t("services.eventStands")}
        prefilledData={{
          product: selectedProduct.name,
          size: selectedSize.name,
          quantity: quantity,
          notes: customizations.designNotes,
        }}
      />

      {/* Design Editor Modal */}
      {showDesignEditor && (
        <DesignServiceEditor
          isOpen={showDesignEditor}
          onClose={() => setShowDesignEditor(false)}
          productName={`${selectedProduct.name} - ${selectedSize.name}`}
          productImage={selectedProduct.image}
          onSave={(designData) => {
            console.log("Design saved:", designData)
            setShowDesignEditor(false)
            toast({
              title: t("common.toast.designSavedTitle"),
              description: t("common.toast.designSavedDesc"),
            })
          }}
        />
      )}
    </div>
  )
}
