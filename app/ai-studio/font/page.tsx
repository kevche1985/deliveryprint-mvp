"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Info, Type, ShoppingCart, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useDigitalCart } from "@/lib/digital-cart-context"
import DigitalProductChoiceModal from "@/components/digital-product-choice-modal"
import { supabase } from "@/lib/supabase"

const fontCategories = [
  "Serif",
  "Sans-serif",
  "Script",
  "Display",
  "Handwritten",
  "Monospace",
  "Decorative",
  "Blackletter",
  "Calligraphy",
  "Graffiti",
]

const fontStyles = [
  "Elegant",
  "Bold",
  "Playful",
  "Vintage",
  "Modern",
  "Minimalist",
  "Futuristic",
  "Retro",
  "Geometric",
  "Organic",
]

const fontWeights = [
  { name: "Light", value: "300" },
  { name: "Regular", value: "400" },
  { name: "Medium", value: "500" },
  { name: "Bold", value: "700" },
]

export default function FontGeneratorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { addItem } = useDigitalCart()
  const [prompt, setPrompt] = useState("")
  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [selectedWeight, setSelectedWeight] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFont, setGeneratedFont] = useState<string | null>(null)
  const [designId, setDesignId] = useState<string | null>(null)
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a font",
        variant: "destructive",
      })
      return
    }

    if (!prompt) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your font",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedFont(null)
    setDesignId(null)

    // Build the complete prompt
    let fullPrompt = prompt
    if (selectedCategory) {
      fullPrompt += ` Category: ${selectedCategory}.`
    }
    if (selectedStyle) {
      fullPrompt += ` Style: ${selectedStyle}.`
    }
    if (selectedWeight) {
      fullPrompt += ` Weight: ${selectedWeight}.`
    }
    if (sampleText) {
      fullPrompt += ` Sample text: "${sampleText}".`
    }

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: "font",
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate font")
      }

      const data = await response.json()
      setGeneratedFont(data.watermarkedUrl)
      setDesignId(data.designId)
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate font. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToCart = async () => {
    if (!designId || !generatedFont) {
      return
    }

    try {
      // Store the digital product in database and storage
      const response = await fetch("/api/digital-products/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          productType: "font",
          name: `AI Font - ${prompt.substring(0, 30)}${prompt.length > 30 ? "..." : ""}`,
          imageUrl: generatedFont,
          description: `AI-generated font: ${prompt}`,
          generationParams: {
            prompt,
            category: selectedCategory,
            style: selectedStyle,
            weight: selectedWeight,
            sampleText,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to store digital product")
      }

      const result = await response.json()
      console.log("Digital product stored:", result.product)

      // Create the product data for the modal
      const fontProduct = {
        id: result.product.id,
        name: result.product.name,
        type: "font",
        previewUrl: result.product.preview_url,
        downloadUrl: result.product.download_url,
        designId: designId,
        generationInputs: {
          prompt,
          category: selectedCategory,
          style: selectedStyle,
          weight: selectedWeight,
          sampleText,
        },
      }

      setCurrentProduct(fontProduct)
      setShowChoiceModal(true)

      toast({
        title: "Font Stored Successfully",
        description: "Your AI font has been saved and is ready for download options.",
      })
    } catch (error: any) {
      console.error("Error storing digital product:", error)
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store the font. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadChoice = async () => {
    if (!currentProduct) return

    // Add the font to digital cart for download
    const fontItem = {
      productId: currentProduct.id,
      designId: currentProduct.designId,
      type: "font" as const,
      name: currentProduct.name,
      basePrice: 14.99,
      previewUrl: currentProduct.previewUrl,
      generationInputs: currentProduct.generationInputs,
      selectedFormats: ["web"],
      selectedLicense: "personal",
      formatOptions: [
        {
          id: "web",
          name: "Web Package",
          description: "WOFF, WOFF2 formats",
          price: 0,
          included: true,
        },
        {
          id: "desktop",
          name: "Desktop Package",
          description: "TTF, OTF formats",
          price: 4.99,
          included: false,
        },
        {
          id: "complete",
          name: "Complete Package",
          description: "All formats included",
          price: 7.99,
          included: false,
        },
      ],
      licenseOptions: [
        {
          id: "personal",
          name: "Personal Use",
          description: "For non-commercial projects",
          price: 0,
          included: true,
        },
        {
          id: "commercial",
          name: "Commercial License",
          description: "For business use",
          price: 9.99,
          included: false,
        },
        {
          id: "extended",
          name: "Extended License",
          description: "Unlimited commercial use",
          price: 19.99,
          included: false,
        },
      ],
      downloadReady: false,
    }

    await addItem(fontItem)

    toast({
      title: "Added to Cart",
      description: "Your AI font has been added to cart for digital download.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Font Generator</h1>
          <p className="text-gray-600">Create unique typography for your brand and designs</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="animate-slide-in-left">
            <Card>
              <CardHeader>
                <CardTitle>Font Details</CardTitle>
                <CardDescription>Describe your vision and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Font Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your ideal font... (e.g., 'A sleek, modern font for a tech startup')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-sm text-gray-500">{prompt.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleText">Sample Text</Label>
                  <Input
                    id="sampleText"
                    placeholder="Enter text to display in your font"
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {fontCategories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedCategory === category
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {fontStyles.map((style) => (
                      <Badge
                        key={style}
                        variant={selectedStyle === style ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedStyle === style
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedStyle(style)}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {fontWeights.map((weight) => (
                      <div
                        key={weight.name}
                        className={`border rounded-lg p-3 cursor-pointer transition-all text-center ${
                          selectedWeight === weight.name
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedWeight(weight.name)}
                      >
                        <p className="text-sm font-medium" style={{ fontWeight: weight.value }}>
                          {weight.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your font will be delivered as OTF, TTF, and WOFF formats for maximum compatibility. Base price:
                    $14.99
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your custom font...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Font
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="animate-slide-in-right">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Your AI-generated font will appear here</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating your font...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds</p>
                  </div>
                ) : generatedFont ? (
                  <div className="relative animate-scale-in w-full">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <img
                        src={generatedFont || "/placeholder.svg"}
                        alt="Generated Font"
                        className="max-w-full h-auto mx-auto"
                        style={{ maxHeight: "300px" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded-lg pointer-events-none">
                        <p className="text-white text-2xl font-bold transform rotate-[-15deg] opacity-30">WATERMARK</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={handleAddToCart}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Choose Delivery Option
                      </Button>
                      <Button onClick={handleGenerate} variant="outline" className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Another
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Type className="h-16 w-16 mx-auto mb-4" />
                    <p>Your font preview will appear here</p>
                    {sampleText && (
                      <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 italic">Sample: {sampleText}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Choice Modal */}
        {showChoiceModal && currentProduct && (
          <DigitalProductChoiceModal
            isOpen={showChoiceModal}
            onClose={() => setShowChoiceModal(false)}
            product={currentProduct}
            onDownloadChoice={handleDownloadChoice}
          />
        )}
      </div>
    </div>
  )
}
