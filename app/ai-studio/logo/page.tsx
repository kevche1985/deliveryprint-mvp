"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Info, Sparkles, ShoppingCart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useDigitalCart } from "@/lib/digital-cart-context"
import DigitalProductChoiceModal from "@/components/digital-product-choice-modal"
import { supabase } from "@/lib/supabase"

const industries = [
  "Technology",
  "Fashion",
  "Food & Beverage",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Entertainment",
  "Sports",
  "Travel",
]

const styles = [
  "Minimalist",
  "Modern",
  "Vintage",
  "Playful",
  "Professional",
  "Abstract",
  "Geometric",
  "Organic",
  "Bold",
  "Elegant",
]

const colorPreferences = [
  { name: "Vibrant", colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"] },
  { name: "Professional", colors: ["#2C3E50", "#34495E", "#7F8C8D"] },
  { name: "Natural", colors: ["#27AE60", "#16A085", "#F39C12"] },
  { name: "Monochrome", colors: ["#000000", "#7F7F7F", "#FFFFFF"] },
]

export default function LogoGeneratorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { addItem } = useDigitalCart()
  const [prompt, setPrompt] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [selectedColors, setSelectedColors] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null)
  const [designId, setDesignId] = useState<string | null>(null)
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate a logo",
        variant: "destructive",
      })
      return
    }

    if (!prompt) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your logo",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedLogo(null)
    setDesignId(null)

    // Build the complete prompt
    let fullPrompt = prompt
    if (selectedIndustry) {
      fullPrompt += ` Industry: ${selectedIndustry}.`
    }
    if (selectedStyle) {
      fullPrompt += ` Style: ${selectedStyle}.`
    }
    if (selectedColors) {
      fullPrompt += ` Color scheme: ${selectedColors}.`
    }

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: "logo",
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate logo")
      }

      const data = await response.json()
      setGeneratedLogo(data.watermarkedUrl)
      setDesignId(data.designId)
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddToCart = async () => {
    if (!designId || !generatedLogo) {
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
          productType: "logo",
          name: `AI Logo - ${prompt.substring(0, 30)}${prompt.length > 30 ? "..." : ""}`,
          imageUrl: generatedLogo,
          description: `AI-generated logo: ${prompt}`,
          generationParams: {
            prompt,
            industry: selectedIndustry,
            style: selectedStyle,
            colors: selectedColors,
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
      const logoProduct = {
        id: result.product.id,
        name: result.product.name,
        type: "logo",
        previewUrl: result.product.preview_url,
        downloadUrl: result.product.download_url,
        designId: designId,
        generationInputs: {
          prompt,
          industry: selectedIndustry,
          style: selectedStyle,
          colors: selectedColors,
        },
      }

      setCurrentProduct(logoProduct)
      setShowChoiceModal(true)

      toast({
        title: "Logo Stored Successfully",
        description: "Your AI logo has been saved and is ready for download options.",
      })
    } catch (error: any) {
      console.error("Error storing digital product:", error)
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store the logo. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadChoice = async () => {
    if (!currentProduct) return

    // Add the logo to digital cart for download
    const logoItem = {
      productId: currentProduct.id,
      designId: currentProduct.designId,
      type: "logo" as const,
      name: currentProduct.name,
      basePrice: 9.99,
      previewUrl: currentProduct.previewUrl,
      generationInputs: currentProduct.generationInputs,
      selectedFormats: ["basic"],
      selectedLicense: "personal",
      formatOptions: [
        {
          id: "basic",
          name: "Basic Package",
          description: "SVG, PNG (512x512, 1024x1024)",
          price: 0,
          included: true,
        },
        {
          id: "professional",
          name: "Professional Package",
          description: "All basic + AI, EPS, PNG up to 4K",
          price: 2.99,
          included: false,
        },
        {
          id: "enterprise",
          name: "Enterprise Package",
          description: "All formats + source files",
          price: 4.99,
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

    await addItem(logoItem)

    toast({
      title: "Added to Cart",
      description: "Your AI logo has been added to cart for digital download.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Logo Generator</h1>
          <p className="text-gray-600">Create a unique logo for your brand in seconds</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="animate-slide-in-left">
            <Card>
              <CardHeader>
                <CardTitle>Logo Details</CardTitle>
                <CardDescription>Describe your vision and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Logo Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your ideal logo... (e.g., 'A modern tech company logo with a circuit board pattern')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-sm text-gray-500">{prompt.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((industry) => (
                      <Badge
                        key={industry}
                        variant={selectedIndustry === industry ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedIndustry === industry
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedIndustry(industry)}
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {styles.map((style) => (
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
                  <Label>Color Preference</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {colorPreferences.map((pref) => (
                      <div
                        key={pref.name}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedColors === pref.name
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedColors(pref.name)}
                      >
                        <p className="text-sm font-medium mb-2">{pref.name}</p>
                        <div className="flex space-x-1">
                          {pref.colors.map((color) => (
                            <div key={color} className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your logo will be generated at 1024x1024 resolution with transparent background. Base price: $9.99
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
                      Creating your unique logo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Logo
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
                <CardDescription>Your AI-generated logo will appear here</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating your logo...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds</p>
                  </div>
                ) : generatedLogo ? (
                  <div className="relative animate-scale-in w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                      <img
                        src={generatedLogo || "/placeholder.svg"}
                        alt="Generated Logo"
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
                    <Sparkles className="h-16 w-16 mx-auto mb-4" />
                    <p>Your logo will appear here after generation</p>
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
