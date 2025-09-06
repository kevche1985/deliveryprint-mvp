"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ImageIcon, Type } from "lucide-react"
import Link from "next/link"

const services = [
  {
    id: "logo",
    title: "AI Logo Generator",
    description: "Create unique, professional logos for your brand",
    price: 25,
    icon: Sparkles,
    href: "/ai-studio/logo",
    examples: ["https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Log-IA-1.png?height=100&width=100", "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Log-IA-2.png?height=100&width=100"],
  },
  {
    id: "image",
    title: "AI Image Generator",
    description: "Generate custom images for your designs",
    price: 5,
    icon: ImageIcon,
    href: "/ai-studio/image",
    examples: ["https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Image-IA-1.png?height=100&width=100", "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Image-IA-2.png?height=100&width=100"],
  },
  {
    id: "font",
    title: "AI Font Generator",
    description: "Design unique typography for your brand",
    price: 5,
    icon: Type,
    href: "/ai-studio/font",
    examples: ["https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Font-IA-1.png?height=100&width=100", "https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images//Font-IA-2.png?height=100&width=100"],
  },
]

export default function AIStudioPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">AI Design Studio</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Harness the power of AI to create stunning designs for your print-on-demand products
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div key={service.id} className="animate-fade-in-delayed">
              <Card
                className={`h-full cursor-pointer transition-all duration-300 ${
                  selectedService === service.id
                    ? "ring-2 ring-[#8B0000] shadow-lg scale-105"
                    : "hover:shadow-lg hover:scale-102"
                }`}
                onClick={() => setSelectedService(service.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <service.icon className="h-12 w-12 text-[#8B0000]" />
                    <span className="text-2xl font-bold text-[#8B0000]">${service.price}</span>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2 mb-6">
                    {service.examples.map((example, i) => (
                      <img
                        key={i}
                        src={example || "/placeholder.svg"}
                        alt={`Example ${i + 1}`}
                        className="w-20 h-20 rounded-lg object-cover animate-scale-in"
                      />
                    ))}
                  </div>
                  <Link href={service.href}>
                    <Button className="w-full bg-[#8B0000] hover:bg-[#6B0000]">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto animate-fade-in-late">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#8B0000] text-white rounded-full flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Choose Your Service</h3>
              <p className="text-gray-600 text-sm">Select from logo, image, or font generation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#8B0000] text-white rounded-full flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">Describe Your Vision</h3>
              <p className="text-gray-600 text-sm">Enter a detailed prompt for AI generation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#8B0000] text-white rounded-full flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">Download & Use</h3>
              <p className="text-gray-600 text-sm">Purchase and download in multiple formats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
