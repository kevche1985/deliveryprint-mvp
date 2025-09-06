"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function TestDownloadPage() {
  const [downloading, setDownloading] = useState(false)

  // Mock design data for testing
  const mockDesign = {
    id: "test-design-123",
    name: "Test AI Logo",
    thumbnail_url: "/placeholder.svg?height=400&width=400",
    created_at: new Date().toISOString(),
    design_data: { type: "logo" },
  }

  const handleTestDownload = () => {
    try {
      setDownloading(true)

      // Create a hidden iframe to handle the download
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.src = `/api/designs/${mockDesign.id}/download`
      document.body.appendChild(iframe)

      // Reset downloading state after a delay
      setTimeout(() => {
        document.body.removeChild(iframe)
        setDownloading(false)

        toast({
          title: "Download Test",
          description: "Download functionality test completed.",
        })
      }, 2000)
    } catch (error) {
      console.error("Error testing download:", error)
      toast({
        title: "Download Test Failed",
        description: "There was a problem testing the download functionality.",
        variant: "destructive",
      })
      setDownloading(false)
    }
  }

  const handleDirectDownload = () => {
    // Test direct image download (fallback method)
    try {
      const link = document.createElement("a")
      link.href = mockDesign.thumbnail_url
      link.download = `${mockDesign.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Direct Download",
        description: "Direct download method tested.",
      })
    } catch (error) {
      console.error("Error with direct download:", error)
      toast({
        title: "Direct Download Failed",
        description: "Direct download method failed.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Download Functionality Test</h1>
          <p className="text-gray-600">Test the design download functionality</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mock Design Card */}
          <Card className="h-full">
            <div className="aspect-square relative overflow-hidden">
              <img
                src={mockDesign.thumbnail_url || "/placeholder.svg"}
                alt={mockDesign.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-[#8B0000] text-white px-2 py-1 rounded text-xs">
                {mockDesign.design_data.type.toUpperCase()}
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{mockDesign.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                Created on {new Date(mockDesign.created_at).toLocaleDateString()}
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleTestDownload} disabled={downloading}>
                  {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {downloading ? "Testing API Download..." : "Test API Download"}
                </Button>

                <Button variant="outline" className="w-full" onClick={handleDirectDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Test Direct Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">API Download Test</h4>
                <p className="text-sm text-gray-600">
                  Tests the server-side download API route at <code>/api/designs/[id]/download</code>
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Direct Download Test</h4>
                <p className="text-sm text-gray-600">Tests direct image download using browser's download attribute</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Expected Behavior</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• API download should trigger server-side image fetch</li>
                  <li>• Direct download should download the placeholder image</li>
                  <li>• Both should show toast notifications</li>
                  <li>• Loading states should be visible during download</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Mock Design Data</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(mockDesign, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Check your browser's download folder and console for results. Toast notifications will appear in the
                bottom-right corner.
              </p>

              <div className="space-y-2">
                <Button asChild variant="outline">
                  <a href="/dashboard">Go to Real Dashboard</a>
                </Button>

                <Button asChild variant="outline" className="ml-2">
                  <a href="/api/designs/test-design-123/download" target="_blank" rel="noreferrer">
                    Test API Route Directly
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
