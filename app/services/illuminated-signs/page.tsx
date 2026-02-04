"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { Zap, Eye, Clock } from "lucide-react"

const illuminatedSignProducts = [
  {
    id: "led-channel-letters",
    name: "LED Channel Letters",
    description: "Premium 3D illuminated letters with LED lighting for maximum visibility and impact",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//LED%20Channel%20Letters.jpg",
    basePrice: 45,
    sizes: [
      { name: '6" Height', price: 45, dimensions: '6" H x Variable W' },
      { name: '8" Height', price: 65, dimensions: '8" H x Variable W' },
      { name: '12" Height', price: 95, dimensions: '12" H x Variable W' },
      { name: '18" Height', price: 145, dimensions: '18" H x Variable W' },
      { name: '24" Height', price: 195, dimensions: '24" H x Variable W' },
    ],
    features: ["3D dimensional letters", "Energy-efficient LEDs", "Weather-resistant", "Custom colors available"],
    category: "Channel Letters",
    unit: "per letter",
  },
  {
    id: "backlit-signs",
    name: "Backlit Signs",
    description: "Professional backlit signs with even illumination for storefronts and businesses",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Backlit%20Signs.jpg",
    basePrice: 299,
    sizes: [
      { name: '24" x 18"', price: 299, dimensions: '24" W x 18" H' },
      { name: '36" x 24"', price: 449, dimensions: '36" W x 24" H' },
      { name: '48" x 36"', price: 699, dimensions: '48" W x 36" H' },
      { name: '60" x 48"', price: 999, dimensions: '60" W x 48" H' },
      { name: "Custom Size", price: 0, dimensions: "Contact for quote" },
    ],
    features: ["Even LED backlighting", "Translucent face material", "Aluminum frame", "Easy installation"],
    category: "Backlit Signs",
    unit: "per sign",
  },
  {
    id: "light-box-signs",
    name: "Light Box Signs",
    description: "Traditional light box signs with modern LED technology for bright, uniform illumination",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Light%20Box%20Signs.jpg",
    basePrice: 199,
    sizes: [
      { name: '18" x 24"', price: 199, dimensions: '18" W x 24" H x 4" D' },
      { name: '24" x 36"', price: 299, dimensions: '24" W x 36" H x 4" D' },
      { name: '36" x 48"', price: 449, dimensions: '36" W x 48" H x 4" D' },
      { name: '48" x 72"', price: 699, dimensions: '48" W x 72" H x 4" D' },
    ],
    features: ["LED light strips", "Acrylic face", "Snap-open frame", "Wall or ceiling mount"],
    category: "Light Boxes",
    unit: "per sign",
  },
  {
    id: "neon-style-led",
    name: "Neon-style LED",
    description: "Modern LED neon strips that replicate traditional neon with energy efficiency",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Neon-style%20LED.jpg",
    basePrice: 25,
    sizes: [
      { name: "1 Linear Foot", price: 25, dimensions: '12" L x 0.5" W' },
      { name: "3 Linear Feet", price: 65, dimensions: '36" L x 0.5" W' },
      { name: "5 Linear Feet", price: 99, dimensions: '60" L x 0.5" W' },
      { name: "10 Linear Feet", price: 179, dimensions: '120" L x 0.5" W' },
      { name: "Custom Length", price: 0, dimensions: "Contact for quote" },
    ],
    features: ["Flexible LED strips", "Multiple color options", "Dimmable", "Easy installation"],
    category: "LED Neon",
    unit: "per linear foot",
  },
  {
    id: "digital-display-signs",
    name: "Digital Display Signs",
    description: "High-resolution LED displays for dynamic content and maximum visual impact",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//digital-stand.jpg",
    basePrice: 1999,
    sizes: [
      { name: '32" Display', price: 1999, dimensions: '32" Diagonal' },
      { name: '43" Display', price: 2799, dimensions: '43" Diagonal' },
      { name: '55" Display', price: 3999, dimensions: '55" Diagonal' },
      { name: '65" Display', price: 5999, dimensions: '65" Diagonal' },
      { name: "Custom Size", price: 0, dimensions: "Contact for quote" },
    ],
    features: ["Full HD resolution", "Remote content management", "Weather-resistant options", "Scheduling software"],
    category: "Digital Displays",
    unit: "per display",
  },
  {
    id: "cabinet-signs",
    name: "Cabinet Signs",
    description: "Illuminated cabinet signs with professional appearance for businesses and storefronts",
    image: "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Cabinet%20Signs.jpg",
    basePrice: 599,
    sizes: [
      { name: '24" x 36"', price: 599, dimensions: '24" W x 36" H x 6" D' },
      { name: '36" x 48"', price: 899, dimensions: '36" W x 48" H x 6" D' },
      { name: '48" x 72"', price: 1299, dimensions: '48" W x 72" H x 6" D' },
      { name: '60" x 96"', price: 1899, dimensions: '60" W x 96" H x 6" D' },
      { name: "Custom Size", price: 0, dimensions: "Contact for quote" },
    ],
    features: ["Aluminum construction", "LED illumination", "Translucent panels", "Professional installation"],
    category: "Cabinet Signs",
    unit: "per sign",
  },
]

export default function IlluminatedSignsPage() {
  const [selectedProduct, setSelectedProduct] = useState(illuminatedSignProducts[0])
  const [selectedSize, setSelectedSize] = useState(illuminatedSignProducts[0].sizes[0])
  const [quantity, setQuantity] = useState(1)
  const [customizations, setCustomizations] = useState({
    designFile: null as File | null,
    designNotes: "",
    colorPreference: "",
    installationNeeded: false,
    rushOrder: false,
  })
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showDesignEditor, setShowDesignEditor] = useState(false)

  const { addItem } = useCart()
  const { toast } = useToast()
  const { t } = useLanguage()
  const localizeText = (text: string) => {
    const map: Record<string, string> = {
      Height: "Altura",
      "Linear Foot": "Pie lineal",
      Feet: "Pies",
      Display: "Pantalla",
      Diagonal: "Diagonal",
      "Custom Size": "Tamaño personalizado",
      "Custom Length": "Longitud personalizada",
      "Contact for quote": "Contactar para cotización",
      "Variable W": "Ancho variable",
    }
    let out = text
    Object.entries(map).forEach(([k, v]) => {
      out = out.replaceAll(k, v)
    })
    // Replace dimension markers
    out = out.replaceAll(' W x ', ' A x ').replaceAll(' H', ' A').replaceAll(' D', ' P')
    return out
  }

  const handleProductChange = (productId: string) => {
    const product = illuminatedSignProducts.find((p) => p.id === productId)
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
    const installationFee = customizations.installationNeeded ? 200 : 0
    const rushFee = customizations.rushOrder ? baseTotal * 0.5 : 0
    return baseTotal + installationFee + rushFee
  }

  const handleAddToCart = () => {
    const localizedProductName = t(`services.illuminatedSignsPage.products.${selectedProduct.id}.name`)
    const cartItemName = `${localizedProductName} - ${selectedSize.name}`
    const cartItem = {
      productId: `illuminated-sign-${selectedProduct.id}`,
      variantId: `${selectedProduct.id}-${selectedSize.name.replace(/\s+/g, "-").toLowerCase()}`,
      quantity,
      price: selectedSize.price,
      name: cartItemName,
      image: selectedProduct.image || "/placeholder.svg?height=200&width=300",
      customizations: {
        size: selectedSize.name,
        dimensions: selectedSize.dimensions,
        designNotes: customizations.designNotes,
        colorPreference: customizations.colorPreference,
        installationNeeded: customizations.installationNeeded,
        rushOrder: customizations.rushOrder,
        designFile: customizations.designFile?.name,
        specifications: {
          material: localizedProductName,
          dimensions: selectedSize.dimensions,
        },
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
        <h1 className="text-4xl font-bold mb-4">{t("services.illuminatedSignsPage.headerTitle")}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("services.illuminatedSignsPage.headerSubtitle")}</p>
        <div className="flex justify-center items-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm">{t("services.illuminatedSignsPage.badges.energyEfficient")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span className="text-sm">{t("services.illuminatedSignsPage.badges.highVisibility")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span className="text-sm">{t("services.illuminatedSignsPage.badges.impact247")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("services.illuminatedSignsPage.selectTitle")}</CardTitle>
              <CardDescription>{t("services.illuminatedSignsPage.selectDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-4">
                <Label>{t("services.illuminatedSignsPage.signType")}</Label>
                <div className="grid grid-cols-1 gap-3">
                  {illuminatedSignProducts.map((product) => (
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
                          alt={t(`services.illuminatedSignsPage.products.${product.id}.name`)}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{t(`services.illuminatedSignsPage.products.${product.id}.name`)}</h3>
                          <p className="text-sm text-gray-600 mt-1">{t(`services.illuminatedSignsPage.products.${product.id}.description`)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{t(`services.illuminatedSignsPage.products.${product.id}.category`)}</Badge>
                            <span className="font-semibold text-red-600">
                              {t("common.from")} ${product.basePrice} {t(`services.illuminatedSignsPage.products.${product.id}.unit`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3">
                <Label>{t("services.illuminatedSignsPage.sizeConfig")}</Label>
                <Select value={selectedProduct.sizes.indexOf(selectedSize).toString()} onValueChange={handleSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct.sizes.map((size, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex justify-between items-center w-full">
                          <span>{localizeText(size.name)}</span>
                          <span className="ml-4 font-semibold">
                            {size.price > 0 ? `$${size.price}` : t("common.quote")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">{t("services.illuminatedSignsPage.dimensions")} {localizeText(selectedSize.dimensions)}</p>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <Label>{t("services.illuminatedSignsPage.quantity")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="w-24"
                />
              </div>

              {/* Color Preference */}
              <div className="space-y-3">
                <Label>{t("services.illuminatedSignsPage.colorPreference")}</Label>
                <Input
                  placeholder={t("services.illuminatedSignsPage.colorPreferencePlaceholder")}
                  value={customizations.colorPreference}
                  onChange={(e) => setCustomizations({ ...customizations, colorPreference: e.target.value })}
                />
              </div>

              {/* Design Notes */}
              <div className="space-y-3">
                <Label>{t("services.illuminatedSignsPage.designRequirements")}</Label>
                <Textarea
                  placeholder={t("services.illuminatedSignsPage.designRequirementsPlaceholder")}
                  value={customizations.designNotes}
                  onChange={(e) => setCustomizations({ ...customizations, designNotes: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Installation */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="installation"
                  checked={customizations.installationNeeded}
                  onChange={(e) => setCustomizations({ ...customizations, installationNeeded: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="installation">{t("services.illuminatedSignsPage.installationLabel")}</Label>
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
                <Label htmlFor="rushOrder">{t("services.illuminatedSignsPage.rushOrderLabel")}</Label>
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
                alt={t(`services.illuminatedSignsPage.products.${selectedProduct.id}.name`)}
                className="w-full h-64 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=256&width=400"
                }}
              />
              <h2 className="text-2xl font-bold mb-2">{t(`services.illuminatedSignsPage.products.${selectedProduct.id}.name`)}</h2>
              <p className="text-gray-600 mb-4">{t(`services.illuminatedSignsPage.products.${selectedProduct.id}.description`)}</p>

              {/* Features */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t("services.illuminatedSignsPage.featuresLabel")}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {[
                    t(`services.illuminatedSignsPage.products.${selectedProduct.id}.features.item1`),
                    t(`services.illuminatedSignsPage.products.${selectedProduct.id}.features.item2`),
                    t(`services.illuminatedSignsPage.products.${selectedProduct.id}.features.item3`),
                    t(`services.illuminatedSignsPage.products.${selectedProduct.id}.features.item4`),
                  ].map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Actions */}
        </div>
      </div>
    </div>
  )
}
