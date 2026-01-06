"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileImage, Ruler, Building2, Lightbulb, ArrowRight, CheckCircle, Clock, Shield } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useEffect, useState } from "react"
import { QuoteRequestModal } from "@/components/quote-request-modal"
import { supabase } from "@/lib/supabase"

const staticServices = [
  {
    id: "digital-printing",
    title: "Digital Printing Services",
    description: "High-quality standard format printing for all your business needs",
    icon: FileImage,
    href: "/services/digital-printing",
    features: ["FOLDCOTE 14", "ADHESIVO", "COUCHE", "BOND", "ETIQUETA ESPECIAL"],
    priceRange: "$0.50 - $3.50",
    turnaround: "1-2 business days",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "large-format",
    title: "Large Format Printing",
    description: "Professional banners, posters, and specialty large-scale printing",
    icon: Ruler,
    href: "/services/large-format",
    features: ["BANNER (1x1 MTS)", "TROQUELADOS", "Custom Sizes", "Weather Resistant"],
    priceRange: "$2.00 - $7.00/sqm",
    turnaround: "2-3 business days",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "event-stands",
    title: "Event Stands & Infrastructure",
    description: "Professional trade show displays and event setup solutions",
    icon: Building2,
    href: "/services/event-stands",
    features: ["Pop-up Stands", "Trade Show Displays", "Table Covers", "Setup Included"],
    priceRange: "$15.00 - $75.00",
    turnaround: "3-5 business days",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "illuminated-signs",
    title: "Illuminated Business Signs",
    description: "Professional LED signs, backlit displays, and digital signage solutions",
    icon: Lightbulb,
    href: "/services/illuminated-signs",
    features: ["LED Channel Letters", "Backlit Signs", "Digital Displays", "Installation"],
    priceRange: "$8.00 - $350.00",
    turnaround: "5-10 business days",
    image: "/placeholder.svg?height=200&width=300",
  },
]

const benefits = [
  {
    icon: CheckCircle,
    title: "Quality Guarantee",
    description: "Premium materials and professional printing processes",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "Quick delivery times to meet your deadlines",
  },
  {
    icon: Shield,
    title: "Professional Service",
    description: "Expert consultation and installation support",
  },
]

export default function ServicesPage() {
  const { t } = useLanguage()
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [quoteServiceType, setQuoteServiceType] = useState("Services")
  const [services, setServices] = useState<any[]>(staticServices)

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
        }
      } catch (e) {
        console.error("Failed to load services", e)
      }
    }
    loadServices()
  }, [t])
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
            {services.map((service) => {
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
                        {service.features.map((feature, index) => (
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("services.page.whyChooseTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("services.page.whyChooseSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <IconComponent className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("services.page.howItWorksTitle")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("services.page.howItWorksSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: t("services.page.steps.chooseService"), description: t("services.page.steps.descChooseService") },
              { step: "2", title: t("services.page.steps.configureUpload"), description: t("services.page.steps.descConfigureUpload") },
              { step: "3", title: t("services.page.steps.reviewOrder"), description: t("services.page.steps.descReviewOrder") },
              { step: "4", title: t("services.page.steps.productionDelivery"), description: t("services.page.steps.descProductionDelivery") },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 text-white rounded-full font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t("services.page.ctaTitle")}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">{t("services.page.ctaSubtitle")}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/services/digital-printing">
              <Button size="lg" className="bg-white text-red-900 hover:bg-gray-100">
                {t("services.page.ctaStartDigitalPrinting")}
              </Button>
            </Link>
            <Link href="/quote">
              <Button size="lg" variant="outline" className="border-white text-red-900 hover:bg-white hover:text-red-900" onClick={() => { setQuoteServiceType("Custom Quote"); setIsQuoteOpen(true) }}>
                {t("services.page.ctaRequestCustomQuote")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Quote Request Modal */}
      {isQuoteOpen && (
        <QuoteRequestModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} serviceType={quoteServiceType} />
      )}
    </div>
  )
}
