"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, PlusCircle, Download, Edit, Trash2, ShoppingCart, Heart, AlertCircle, Save } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserOrders } from "@/lib/database"
import type { Order } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useDigitalCart, type DigitalProductType } from "@/lib/digital-cart-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserPurchasedDigitalProducts, getUserUnpurchasedDigitalProducts } from "@/lib/digital-product-service"

export default function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasedDesigns, setPurchasedDesigns] = useState<any[]>([])
  const [unpurchasedDesigns, setUnpurchasedDesigns] = useState<any[]>([])
  const [showUnpurchased, setShowUnpurchased] = useState(false)
  const [downloadingDesigns, setDownloadingDesigns] = useState<Record<string, boolean>>({})
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({})
  const { addItem } = useDigitalCart()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])
  
  // Load user data
  useEffect(() => {
    if (user?.id && !authLoading) {
      loadUserData()
    }
  }, [user?.id, authLoading])
  
  const loadUserData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Load orders and digital products in parallel
      const [userOrders, purchased, unpurchased] = await Promise.all([
        getUserOrders(user.id),
        getUserPurchasedDigitalProducts(user.id),
        getUserUnpurchasedDigitalProducts(user.id)
      ])
      
      setOrders(userOrders)
      setPurchasedDesigns(purchased)
      setUnpurchasedDesigns(unpurchased)
    } catch (err: any) {
      console.error('Error loading user data:', err)
      setError(err.message || 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle download for purchased designs
  const handleDownload = async (design: any, format = 'PNG') => {
    try {
      setDownloadingDesigns(prev => ({ ...prev, [design.id]: true }))
      
      const response = await fetch(`/api/digital-products/${design.id}/download?format=${format}`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${design.name}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Download Complete",
        description: `${design.name} downloaded successfully.`,
      })
    } catch (error: any) {
      console.error('Download failed:', error)
      toast({
        title: "Download Failed",
        description: error.message || 'Failed to download design.',
        variant: "destructive",
      })
    } finally {
      setDownloadingDesigns(prev => ({ ...prev, [design.id]: false }))
    }
  }
  
  // Handle adding unpurchased design to cart
  const handleAddToCart = (design: any) => {
    try {
      addItem({
          productId: design.id,
          designId: design.id,
          type: design.type as DigitalProductType,
          name: design.name,
          basePrice: design.base_price || 4.99,
          previewUrl: design.preview_url,
          generationInputs: design.generation_inputs || {},
          selectedFormats: ['basic'],
          selectedLicense: 'personal' as any,
          formatOptions: getDefaultFormatOptions(design.type) as any,
          licenseOptions: ['personal', 'commercial'] as any,
          downloadReady: false,
        })
      
      toast({
        title: "Added to Cart",
        description: `${design.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // NEW: Save unpurchased/purchased design (adds a saved flag in metadata)
  const handleSaveDesign = async (design: any) => {
    try {
      const { data, error } = await supabase
        .from("digital_products")
        .update({
          metadata: {
            ...(design.metadata || {}),
            saved: true,
            saved_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", design.id)
        .select()
        .single()
      
      if (error) throw error
      
      toast({
        title: "Saved",
        description: `${design.name} saved to your library.`,
      })
      
      // Update local state copies
      setUnpurchasedDesigns((prev) => prev.map((d) => (d.id === design.id ? { ...d, ...(data || {}) } : d)))
      setPurchasedDesigns((prev) => prev.map((d) => (d.id === design.id ? { ...d, ...(data || {}) } : d)))
    } catch (error: any) {
      console.error('Save failed:', error)
      toast({
        title: "Save Failed",
        description: error.message || 'Could not save design.',
        variant: "destructive",
      })
    }
  }

  // NEW: Delete a design (unpurchased or purchased)
  const handleDeleteDesign = async (design: any) => {
    try {
      const confirmed = window.confirm(`Delete "${design.name}"? This action cannot be undone.`)
      if (!confirmed) return
      
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", design.id)
      
      if (error) throw error
      
      toast({
        title: "Deleted",
        description: `${design.name} was deleted.`,
      })
      
      setUnpurchasedDesigns((prev) => prev.filter((d) => d.id !== design.id))
      setPurchasedDesigns((prev) => prev.filter((d) => d.id !== design.id))
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast({
        title: "Delete Failed",
        description: error.message || 'Could not delete design.',
        variant: "destructive",
      })
    }
  }
  
  // Helper function for format options
  const getDefaultFormatOptions = (type: string) => {
    switch (type) {
      case 'logo':
        return ['PNG', 'SVG', 'PDF']
      case 'image':
        return ['PNG', 'JPG', 'PDF']
      case 'font':
        return ['TTF', 'OTF', 'WOFF']
      default:
        return ['PNG', 'PDF']
    }
  }
  
  // Handle format selection
  const handleFormatChange = (designId: string, format: string) => {
    setSelectedFormats(prev => ({ ...prev, [designId]: format }))
  }
  
  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  // Show error if user not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.first_name || user.email}!</h1>
        <p className="text-gray-600">Manage your orders, designs, and account settings.</p>
      </div>
      
      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="designs">My Designs</TabsTrigger>
          <TabsTrigger value="digital">Digital Products</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Track your recent print orders</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Button asChild>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.order_number}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="designs">
          <Card>
            <CardHeader>
              <CardTitle>My Designs</CardTitle>
              <CardDescription>Your saved and created designs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No designs yet</p>
                <Button asChild>
                  <Link href="/ai-studio">Create Design</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="digital">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Digital Products</h2>
              <div className="flex gap-2">
                <Button 
                  variant={!showUnpurchased ? "default" : "outline"}
                  onClick={() => setShowUnpurchased(false)}
                >
                  Purchased ({purchasedDesigns.length})
                </Button>
                <Button 
                  variant={showUnpurchased ? "default" : "outline"}
                  onClick={() => setShowUnpurchased(true)}
                >
                  Unpurchased ({unpurchasedDesigns.length})
                </Button>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/ai-studio">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New
                  </Link>
                </Button>
              </div>
            </div>
            
            {showUnpurchased ? (
              // Unpurchased Designs
              unpurchasedDesigns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 mb-4">No unpurchased designs</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link href="/ai-studio">Create New Design</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unpurchasedDesigns.map((design, index) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full">
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={design.preview_url || "/placeholder.svg"}
                            alt={design.name}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-purple-600">
                            {design.type.charAt(0).toUpperCase() + design.type.slice(1)}
                          </Badge>
                          <Badge className="absolute top-2 left-2 bg-amber-500">
                            Unpurchased
                          </Badge>
                          {design?.metadata?.saved && (
                            <Badge className="absolute top-12 left-2 bg-green-600">Saved</Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{design.name}</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Created {new Date(design.created_at).toLocaleDateString()}
                          </p>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleSaveDesign(design)}
                                className="flex-1"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeleteDesign(design)}
                                className="flex-1"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                            <Button
                              onClick={() => handleAddToCart(design)}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart - ${design.base_price || 4.99}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              // Purchased Designs
              purchasedDesigns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 mb-4">No purchased designs yet</p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link href="/ai-studio">Create Your First Design</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedDesigns.map((design, index) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="h-full">
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={design.preview_url || "/placeholder.svg"}
                            alt={design.name}
                            className="w-full h-full object-cover"
                          />
                          <Badge className="absolute top-2 right-2 bg-purple-600">
                            {design.type.charAt(0).toUpperCase() + design.type.slice(1)}
                          </Badge>
                          <Badge className="absolute top-2 left-2 bg-green-500">
                            Purchased
                          </Badge>
                          {design?.metadata?.saved && (
                            <Badge className="absolute top-12 left-2 bg-green-600">Saved</Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{design.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Created {new Date(design.created_at).toLocaleDateString()}
                          </p>
                          
                          {/* Format Selection */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Download Format
                            </label>
                            <select
                              value={selectedFormats[design.id] || 'PNG'}
                              onChange={(e) => handleFormatChange(design.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              {getDefaultFormatOptions(design.type).map((format) => (
                                <option key={format} value={format}>
                                  {format.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <Button
                            onClick={() => handleDownload(design, selectedFormats[design.id] || 'PNG')}
                            disabled={downloadingDesigns[design.id]}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {downloadingDesigns[design.id] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            {downloadingDesigns[design.id] 
                              ? 'Downloading...' 
                              : `Download ${(selectedFormats[design.id] || 'PNG').toUpperCase()}`
                            }
                          </Button>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleSaveDesign(design)}
                              className="flex-1"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteDesign(design)}
                              className="flex-1"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                {profile && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-gray-600">
                        {profile.first_name} {profile.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <p className="text-sm text-gray-600">{profile.role}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}