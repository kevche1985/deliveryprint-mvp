"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Database, Upload, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getUserDigitalProducts } from "@/lib/digital-product-service"
import { supabase } from "@/lib/supabase"

export default function TestDigitalFlowPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isTestingStorage, setIsTestingStorage] = useState(false)
  const [isTestingRetrieval, setIsTestingRetrieval] = useState(false)
  const [isTestingDownload, setIsTestingDownload] = useState(false)
  const [testResults, setTestResults] = useState<any>({})
  const [userProducts, setUserProducts] = useState<any[]>([])

  const testImageStorage = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to test the flow",
        variant: "destructive",
      })
      return
    }

    setIsTestingStorage(true)
    try {
      console.log("Testing storage for user:", user.id)

      // Get the current session to pass the auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("No active session found")
      }

      console.log("Session found, making API call...")

      // Use a test image URL (placeholder)
      const testImageUrl = "/placeholder.svg?height=400&width=400&text=Test+Logo"

      // Call the API route with proper authentication
      const response = await fetch("/api/digital-products/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productType: "logo",
          name: "Test Logo - Flow Verification",
          imageUrl: testImageUrl,
          description: "This is a test logo to verify the digital product flow",
          generationParams: {
            prompt: "Test logo for flow verification",
            style: "Modern",
            industry: "Technology",
          },
        }),
      })

      console.log("API response status:", response.status)

      const result = await response.json()
      console.log("API response:", result)

      if (response.ok && result.success) {
        setTestResults((prev) => ({
          ...prev,
          storage: { success: true, productId: result.product.id, data: result.product },
        }))
        toast({
          title: "Storage Test Successful",
          description: "Digital product stored successfully in database",
        })
      } else {
        setTestResults((prev) => ({
          ...prev,
          storage: { success: false, error: result.error || "Failed to store product" },
        }))
        toast({
          title: "Storage Test Failed",
          description: result.error || "Failed to store digital product",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Storage test error:", error)
      setTestResults((prev) => ({
        ...prev,
        storage: { success: false, error: error.message },
      }))
      toast({
        title: "Storage Test Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTestingStorage(false)
    }
  }

  const testProductRetrieval = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to test the flow",
        variant: "destructive",
      })
      return
    }

    setIsTestingRetrieval(true)
    try {
      console.log("Testing retrieval for user:", user.id)
      const products = await getUserDigitalProducts(user.id)
      console.log("Retrieved products:", products)
      setUserProducts(products)

      setTestResults((prev) => ({
        ...prev,
        retrieval: { success: true, count: products.length, data: products },
      }))

      toast({
        title: "Retrieval Test Successful",
        description: `Found ${products.length} digital products`,
      })
    } catch (error: any) {
      console.error("Retrieval test error:", error)
      setTestResults((prev) => ({
        ...prev,
        retrieval: { success: false, error: error.message },
      }))
      toast({
        title: "Retrieval Test Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTestingRetrieval(false)
    }
  }

  const testDownloadFlow = async (productId: string) => {
    setIsTestingDownload(true)
    try {
      console.log("Testing download for product:", productId)

      // Get the current session for auth
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Test the download API endpoint
      const response = await fetch(`/api/digital-products/${productId}/download`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      })

      console.log("Download test response status:", response.status)

      if (response.ok) {
        setTestResults((prev) => ({
          ...prev,
          download: { success: true, status: response.status },
        }))
        toast({
          title: "Download Test Successful",
          description: "Download endpoint is working correctly",
        })
      } else {
        const errorText = await response.text()
        console.log("Download test error:", errorText)
        setTestResults((prev) => ({
          ...prev,
          download: { success: false, status: response.status, error: errorText },
        }))
        toast({
          title: "Download Test Failed",
          description: `Status: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Download test error:", error)
      setTestResults((prev) => ({
        ...prev,
        download: { success: false, error: error.message },
      }))
      toast({
        title: "Download Test Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsTestingDownload(false)
    }
  }

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return null
    return success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === undefined) return <Badge variant="outline">Not Tested</Badge>
    return success ? <Badge className="bg-green-500">Success</Badge> : <Badge variant="destructive">Failed</Badge>
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to test the digital product flow</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digital Product Flow Test</h1>
        <p className="text-gray-600">Test the complete AI Studio image storage and retrieval flow</p>
        <p className="text-sm text-gray-500 mt-2">User ID: {user.id}</p>
        <p className="text-sm text-gray-500">Email: {user.email}</p>
      </div>

      <div className="grid gap-6">
        {/* Test 1: Storage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <CardTitle>1. Image Storage Test</CardTitle>
                {getStatusIcon(testResults.storage?.success)}
              </div>
              {getStatusBadge(testResults.storage?.success)}
            </div>
            <CardDescription>Test storing an AI-generated image in Supabase storage and database</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testImageStorage} disabled={isTestingStorage} className="mb-4">
              {isTestingStorage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Storage...
                </>
              ) : (
                "Test Image Storage"
              )}
            </Button>

            {testResults.storage && (
              <Alert className={testResults.storage.success ? "border-green-200" : "border-red-200"}>
                <AlertDescription>
                  {testResults.storage.success ? (
                    <div>
                      <p className="font-medium text-green-800">Storage successful!</p>
                      <p className="text-sm text-green-600">Product ID: {testResults.storage.productId}</p>
                      {testResults.storage.data && (
                        <div className="mt-2 text-xs text-green-600">
                          <p>Preview URL: {testResults.storage.data.preview_url?.substring(0, 50)}...</p>
                          <p>Download URL: {testResults.storage.data.download_url?.substring(0, 50)}...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-red-800">Storage failed!</p>
                      <p className="text-sm text-red-600">{testResults.storage.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test 2: Retrieval */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>2. Product Retrieval Test</CardTitle>
                {getStatusIcon(testResults.retrieval?.success)}
              </div>
              {getStatusBadge(testResults.retrieval?.success)}
            </div>
            <CardDescription>Test retrieving digital products from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testProductRetrieval} disabled={isTestingRetrieval} className="mb-4">
              {isTestingRetrieval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Retrieval...
                </>
              ) : (
                "Test Product Retrieval"
              )}
            </Button>

            {testResults.retrieval && (
              <Alert className={testResults.retrieval.success ? "border-green-200" : "border-red-200"}>
                <AlertDescription>
                  {testResults.retrieval.success ? (
                    <div>
                      <p className="font-medium text-green-800">Retrieval successful!</p>
                      <p className="text-sm text-green-600">Found {testResults.retrieval.count} products</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-red-800">Retrieval failed!</p>
                      <p className="text-sm text-red-600">{testResults.retrieval.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {userProducts.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Your Digital Products:</h4>
                <div className="space-y-2">
                  {userProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.type} • Status: {product.status || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                        {product.preview_url && (
                          <p className="text-xs text-blue-500">Preview: {product.preview_url.substring(0, 40)}...</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testDownloadFlow(product.id)}
                        disabled={isTestingDownload}
                      >
                        Test Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test 3: Download */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <CardTitle>3. Download Flow Test</CardTitle>
                {getStatusIcon(testResults.download?.success)}
              </div>
              {getStatusBadge(testResults.download?.success)}
            </div>
            <CardDescription>Test the download API endpoint (click "Test Download" on a product above)</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.download && (
              <Alert className={testResults.download.success ? "border-green-200" : "border-red-200"}>
                <AlertDescription>
                  {testResults.download.success ? (
                    <div>
                      <p className="font-medium text-green-800">Download endpoint working!</p>
                      <p className="text-sm text-green-600">Status: {testResults.download.status}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-red-800">Download test failed!</p>
                      <p className="text-sm text-red-600">
                        Status: {testResults.download.status} - {testResults.download.error}
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
            <CardDescription>Overall status of the digital product flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(testResults.storage?.success)}
                </div>
                <p className="text-sm font-medium">Storage</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(testResults.retrieval?.success)}
                </div>
                <p className="text-sm font-medium">Retrieval</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(testResults.download?.success)}
                </div>
                <p className="text-sm font-medium">Download</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
