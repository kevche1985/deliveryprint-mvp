"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type Product, type Tenant, getProducts, getTenantBySlug } from "@/lib/database"

export default function TenantProductsPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const t = await getTenantBySlug(slug)
      setTenant(t)
      if (t) {
        const p = await getProducts({ tenantId: t.id, limit: 24 })
        setProducts(p)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tenant ? `Products for ${tenant.name}` : `Products for ${slug}`}</h1>
          <p className="text-gray-600">Browse catalog for this tenant</p>
        </div>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No products found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This tenant does not have any products yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="truncate">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={product.image || "/placeholder.svg?height=200&width=300"}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">${product.price?.toFixed?.(2) ?? product.price}</span>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/products/${product.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}