"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { getProducts, getCategories, type Product, type Category } from "@/lib/database"
import Image from "next/image"
import { useLanguage } from "@/lib/language-context"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useLanguage()

  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesData = await getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      try {
        const options: any = {
          search: searchQuery || undefined,
          sortBy:
            sortBy === "name"
              ? "name"
              : sortBy === "price-asc"
                ? "price"
                : sortBy === "price-desc"
                  ? "price"
                  : "created_at",
          sortOrder: sortBy === "price-desc" ? "desc" : "asc",
        }

        if (selectedCategory) {
          options.category = selectedCategory
        }

        const productsData = await getProducts(options)
        setProducts(productsData)
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [searchQuery, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("products.catalogTitle")}</h1>
          <p className="text-gray-600">{t("products.catalogDescription")}</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={t("products.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("products.allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("products.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("products.sortName")}</SelectItem>
                <SelectItem value="price-asc">{t("products.sortPriceAsc")}</SelectItem>
                <SelectItem value="price-desc">{t("products.sortPriceDesc")}</SelectItem>
                <SelectItem value="newest">{t("products.sortNewest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
              {products.map((product, index) => (
                <div key={product.id} className="h-full">
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                     <CardHeader className="p-0">
                       <div className="aspect-square relative overflow-hidden rounded-t-lg">
                         <Image
                           src={product.image || "/placeholder.svg?height=300&width=300&query=product"}
                           alt={product.name}
                           fill
                           sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                           className="object-cover hover:scale-105 transition-transform duration-300"
                         />
                         {product.is_customizable && (
                           <Badge className="absolute top-2 right-2 bg-[#8B0000]">{t("products.badgeCustomizable")}</Badge>
                         )}
                       </div>
                     </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                       <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                       <p className="text-2xl font-bold text-[#8B0000]">${product.price.toFixed(2)}</p>
                     </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto">
                       <Link href={`/products/${product.id}`} className="w-full">
                         <Button className="w-full bg-[#8B0000] hover:bg-[#6B0000]">{product.is_customizable ? t("products.buttonCustomize") : language === "es" ? "Ver" : "View"}</Button>
                       </Link>
                     </CardFooter>
                   </Card>
                 </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{t("products.noProductsFound")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
