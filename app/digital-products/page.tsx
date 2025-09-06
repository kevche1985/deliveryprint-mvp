import Link from "next/link"
import { Sparkles, FileImage, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DigitalProductsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          AI-Generated Digital Products
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create professional digital assets in minutes with our advanced AI technology. Perfect for businesses,
          designers, and creators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Logo Generator Card */}
        <Card className="overflow-hidden border-2 hover:border-purple-500 transition-all duration-300">
          <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-20 w-20 text-white" />
          </div>
          <CardHeader>
            <CardTitle>AI Logo Generator</CardTitle>
            <CardDescription>Create unique vector logos for your brand</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="mr-2">✓</span> Vector format (SVG, AI, EPS)
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Multiple variations
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Commercial license available
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-2xl font-bold">$9.99</p>
              <p className="text-sm text-gray-500">per logo</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <Link href="/ai-studio/logo">Generate Now</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Image Generator Card */}
        <Card className="overflow-hidden border-2 hover:border-blue-500 transition-all duration-300">
          <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <FileImage className="h-20 w-20 text-white" />
          </div>
          <CardHeader>
            <CardTitle>AI Image Generator</CardTitle>
            <CardDescription>Create stunning images from text descriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="mr-2">✓</span> High-resolution options
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Multiple formats (PNG, JPG, WebP)
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Print-ready option available
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-2xl font-bold">$4.99</p>
              <p className="text-sm text-gray-500">per image</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/ai-studio/image">Generate Now</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Font Generator Card */}
        <Card className="overflow-hidden border-2 hover:border-indigo-500 transition-all duration-300">
          <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Type className="h-20 w-20 text-white" />
          </div>
          <CardHeader>
            <CardTitle>AI Font Generator</CardTitle>
            <CardDescription>Create custom font families for your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="mr-2">✓</span> Web & desktop formats
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Multiple weights included
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Extended license available
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-2xl font-bold">$14.99</p>
              <p className="text-sm text-gray-500">per font family</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Link href="/ai-studio/font">Generate Now</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-xl p-8 mb-16">
        <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Generate</h3>
            <p className="text-gray-600">
              Describe what you want and our AI will create multiple options for you to choose from.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Customize</h3>
            <p className="text-gray-600">Select your preferred format, size, and license options to suit your needs.</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Download</h3>
            <p className="text-gray-600">
              Instantly download your files after purchase and start using them right away.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to create?</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Start generating professional digital assets with our AI tools today.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Link href="/ai-studio">Explore AI Studio</Link>
        </Button>
      </div>
    </div>
  )
}
