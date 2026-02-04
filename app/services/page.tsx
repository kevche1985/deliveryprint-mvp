"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileImage, Ruler, Building2, Lightbulb, ArrowRight, CheckCircle, Clock, Shield } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useEffect, useState, useMemo } from "react"
import { QuoteRequestModal } from "@/components/quote-request-modal"
import { supabase } from "@/lib/supabase"

export default function ServicesPage() {
  const { t, tRaw } = useLanguage()
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [quoteServiceType, setQuoteServiceType] = useState("Services")
  const [services, setServices] = useState<any[]>([])

  const benefits = [
    {
      icon: CheckCircle,
      title: t("services.benefits.quality.title"),
      description: t("services.benefits.quality.description"),
    },
    {
      icon: Clock,
      title: t("services.benefits.speed.title"),
      description: t("services.benefits.speed.description"),
    },
    {
      icon: Shield,
      title: t("services.benefits.service.title"),
      description: t("services.benefits.service.description"),
    },
  ]

  const staticServices = useMemo(() => [
    {
      id: "digital-printing",
      title: t("services.items.digitalPrinting.title"),
      description: t("services.items.digitalPrinting.description"),
      icon: FileImage,
      href: "/services/digital-printing",
      features: (tRaw("services.items.digitalPrinting.features") as string[]) || [],
      priceRange: t("services.items.digitalPrinting.priceRange"),
      turnaround: t("services.items.digitalPrinting.turnaround"),
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "large-format",
      title: t("services.items.largeFormat.title"),
      description: t("services.items.largeFormat.description"),
      icon: Ruler,
      href: "/services/large-format",
      features: (tRaw("services.items.largeFormat.features") as string[]) || [],
      priceRange: t("services.items.largeFormat.priceRange"),
      turnaround: t("services.items.largeFormat.turnaround"),
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "event-stands",
      title: t("services.items.eventStands.title"),
      description: t("services.items.eventStands.description"),
      icon: Building2,
      href: "/services/event-stands",
      features: (tRaw("services.items.eventStands.features") as string[]) || [],
      priceRange: t("services.items.eventStands.priceRange"),
      turnaround: t("services.items.eventStands.turnaround"),
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "illuminated-signs",
      title: t("services.items.illuminatedSigns.title"),
      description: t("services.items.illuminatedSigns.description"),
      icon: Lightbulb,
      href: "/services/illuminated-signs",
      features: (tRaw("services.items.illuminatedSigns.features") as string[]) || [],
      priceRange: t("services.items.illuminatedSigns.priceRange"),
      turnaround: t("services.items.illuminatedSigns.turnaround"),
      image: "/placeholder.svg?height=200&width=300",
    },
  ], [t, tRaw])

  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
        
        if (error) throw error
        
        if (data && data.length > 0) {
          const mapped = data.map((s) => ({
            id: s.slug || s.id,
            title: s.name,
            description: s.description || "",
            icon: FileImage,
            href: s.slug ? `/services/${s.slug}` : "/services",
            features: [],
            priceRange: s.price ? `$${Number(s.price).toFixed(2)}+` : t("services.page.startingFrom"),
            turnaround: t("services.page.turnaroundDefault"),
            image: s.image || "/placeholder.svg?height=200&width=300",
          }))
          setServices(mapped)
        } else {
          setServices([])
        }
      } catch (e) {
        console.error("Failed to load services", e)
        setServices([])
      }
    }
    loadServices()
  }, [t])

  const displayServices = services.length > 0 ? services : staticServices

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-900 to-red-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">{t("services.page.heroTitle")}</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">{t("services.page.heroSubtitle")}</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-red-900 hover:bg-gray-100">{t("services.page.ctaGetStarted")}</Button>
            <Button size="lg" variant="outline" className="border-white text-red-900 hover:bg-white hover:text-red-900" onClick={() => { setQuoteServiceType("Services"); setIsQuoteOpen(true) }}>
              {t("services.page.ctaRequestQuote")}
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("services.page.sectionTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("services.page.sectionSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {displayServices.map((service) => {
              const IconComponent = service.icon
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow group">
                  <div className="relative">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-red-600 text-white">{service.turnaround}</Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-red-600" />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </div>
                    <p className="text-gray-600">{service.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{t("services.page.featuresLabel")}</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">{t("services.page.startingFrom")}</p>
                        <p className="text-lg font-bold text-red-600">{service.priceRange}</p>
                      </div>
                      <Link href={service.href}>
                        <Button className="bg-red-600 hover:bg-red-700 group-hover:translate-x-1 transition-transform">
                          {t("services.page.explore")}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="p-4 bg-white rounded-full shadow-md mb-4">
                    <IconComponent className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("services.page.ctaFinalTitle")}</h2>
          <p className="text-xl mb-8 opacity-90">{t("services.page.ctaFinalSubtitle")}</p>
          <Button size="lg" className="bg-white text-red-900 hover:bg-gray-100" onClick={() => { setQuoteServiceType("Services"); setIsQuoteOpen(true) }}>
            {t("services.page.ctaRequestQuote")}
          </Button>
        </div>
      </section>
      
      <QuoteRequestModal 
        isOpen={isQuoteOpen} 
        onClose={() => setIsQuoteOpen(false)} 
        initialServiceType={quoteServiceType}
      />
    </div>
  )
}
