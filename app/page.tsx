"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Package, ShoppingCart, Printer, FileText } from "lucide-react"
import { type Product, getProducts } from "@/lib/database"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

// Minimal product shape used for fallback/sample items alongside DB Products
type MinimalProduct = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const products = await getProducts({ featured: true, limit: 6 })
        setFeaturedProducts(products)
      } catch (err) {
        console.error("Error fetching featured products:", err)
        setError(t("home.errors.failedToLoadFeatured"))
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedProducts()
  }, [])

  const handleAddToCartAndCheckout = (product: Product | MinimalProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: (product as any).image || "/placeholder.svg",
      customizations: {}, // No customizations for direct product add
      // No design associated when adding directly from home page
      designId: undefined,
    })
    toast({
      title: t("common.toast.addedToCartTitle"),
      description: `${product.name} ${t("common.toast.addedToCartDescSuffix")}`,
    })
    router.push("/checkout")
  }

  const sampleProducts = [
    {
      id: "sample-1",
      name: "Custom T-Shirt",
      description: "Design your own unique T-shirt.",
      price: 25.0,
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: "sample-2",
      name: "Mug Printing",
      description: "Personalized mugs for any occasion.",
      price: 15.0,
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: "sample-3",
      name: "Poster Design",
      description: "High-quality custom posters.",
      price: 30.0,
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      id: "sample-4",
      name: "Business Cards",
      description: "Professional business card printing.",
      price: 20.0,
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[500px] bg-gradient-to-r from-red-700 to-red-900 flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/placeholder.svg?height=500&width=1200"
            alt="Background pattern"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
            {t("home.heroTitle")}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            {t("home.heroSubtitle")}
          </p>
          <Link href="/products" passHref>
            <Button size="lg" className="bg-white text-red-800 hover:bg-gray-100 hover:text-red-900 shadow-lg">
              {t("home.exploreProducts")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t("home.servicesTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Printer className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>{t("services.digitalPrinting")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("services.digitalPrintingDesc")}</CardDescription>
              </CardContent>
              <CardFooter>
                <Link href="/services/digital-printing" className="w-full">
                  <Button variant="outline" className="w-full bg-transparent">
                    {t("common.learnMore")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Package className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>{t("services.largeFormat")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("services.largeFormatDesc")}</CardDescription>
              </CardContent>
              <CardFooter>
                <Link href="/services/large-format" className="w-full">
                  <Button variant="outline" className="w-full bg-transparent">
                    {t("common.learnMore")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <FileText className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>{t("services.designStudio")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("services.designStudioDesc")}</CardDescription>
              </CardContent>
              <CardFooter>
                <Link href="/ai-studio" className="w-full">
                  <Button variant="outline" className="w-full bg-transparent">
                    {t("common.startDesigning")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t("home.featuredProductsTitle")}</h2>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="w-full h-[300px] bg-gray-200 rounded-t-lg flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center p-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
              <p>{t("home.errors.displayingSample")}</p>
            </div>
          )}

          {!loading && featuredProducts.length === 0 && !error && (
            <div className="text-center text-gray-500 py-8">
              <p>{t("home.noFeatured")}</p>
            </div>
          )}

          {!loading && (featuredProducts.length > 0 || error) && (
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {(featuredProducts.length > 0 ? featuredProducts : sampleProducts).map((product) => (
                  <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="overflow-hidden">
                      <div className="relative w-full h-[300px] bg-gray-100 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <CardTitle className="text-xl font-semibold mb-2">{product.name}</CardTitle>
                        <CardDescription className="text-gray-600 line-clamp-2">
                          {product.description || t("home.noDescription")}
                        </CardDescription>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center p-4 pt-0">
                        <span className="text-2xl font-bold text-red-600">${product.price.toFixed(2)}</span>
                        <Button onClick={() => handleAddToCartAndCheckout(product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t("common.addToCart")}
                        </Button>
                      </CardFooter>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-red-800 text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">{t("home.ctaTitle")}</h2>
          <p className="text-xl mb-8">
            {t("home.ctaSubtitle")}
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/ai-studio" passHref>
              <Button size="lg" className="bg-white text-red-800 hover:bg-gray-100 hover:text-red-900 shadow-lg">
                {t("common.startDesigning")}
              </Button>
            </Link>
            <Link href="/quote" passHref>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-red-800 shadow-lg bg-transparent"
              >
                {t("home.ctaGetQuote")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
