"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Clock, CheckCircle, AlertCircle, FileImage, Type, Sparkles } from "lucide-react"

// Mock data for demonstration
const mockDownloads = [
  {
    id: "dl-1",
    name: "Company Logo - Modern",
    type: "logo",
    purchaseDate: "2025-05-28",
    expiryDate: "2025-06-04",
    downloadCount: 2,
    maxDownloads: 10,
    formats: ["SVG", "PNG", "EPS"],
    license: "Commercial",
    previewUrl: "/placeholder.svg?height=200&width=200",
    status: "active",
  },
  {
    id: "dl-2",
    name: "Product Showcase Image",
    type: "image",
    purchaseDate: "2025-05-25",
    expiryDate: "2025-06-01",
    downloadCount: 5,
    maxDownloads: 10,
    formats: ["PNG", "JPG", "WebP"],
    license: "Personal",
    previewUrl: "/placeholder.svg?height=200&width=200",
    status: "active",
  },
  {
    id: "dl-3",
    name: "Futura Sans Font Family",
    type: "font",
    purchaseDate: "2025-05-20",
    expiryDate: "2025-05-27",
    downloadCount: 10,
    maxDownloads: 10,
    formats: ["TTF", "OTF", "WOFF"],
    license: "Extended",
    previewUrl: "/placeholder.svg?height=200&width=200",
    status: "expired",
  },
]

export default function DigitalDownloadsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredDownloads =
    activeTab === "all" ? mockDownloads : mockDownloads.filter((download) => download.status === activeTab)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "logo":
        return <Sparkles className="h-5 w-5" />
      case "image":
        return <FileImage className="h-5 w-5" />
      case "font":
        return <Type className="h-5 w-5" />
      default:
        return <FileImage className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-500">Active</Badge>
    }
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-300">
        Expired
      </Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-3/4">
          <h1 className="text-3xl font-bold mb-6">Your Digital Downloads</h1>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredDownloads.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium mb-2">No downloads found</h3>
              <p className="text-gray-500 mb-6">You don't have any digital products in this category.</p>
              <Button asChild>
                <a href="/digital-products">Browse Digital Products</a>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDownloads.map((download) => (
                <Card
                  key={download.id}
                  className={`overflow-hidden ${download.status === "expired" ? "opacity-70" : ""}`}
                >
                  <div className="h-40 bg-gray-100 relative">
                    <img
                      src={download.previewUrl || "/placeholder.svg"}
                      alt={download.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">{getStatusBadge(download.status)}</div>
                    <div className="absolute top-2 left-2 bg-white rounded-full p-1">{getTypeIcon(download.type)}</div>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{download.name}</CardTitle>
                        <CardDescription>
                          {download.type.charAt(0).toUpperCase() + download.type.slice(1)} • {download.license} License
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        <span>
                          {download.status === "active"
                            ? `Expires ${new Date(download.expiryDate).toLocaleDateString()}`
                            : `Expired ${new Date(download.expiryDate).toLocaleDateString()}`}
                        </span>
                      </div>
                      <div>
                        Downloads: {download.downloadCount}/{download.maxDownloads}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {download.formats.map((format) => (
                        <Badge key={format} variant="outline">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={download.status === "expired" || download.downloadCount >= download.maxDownloads}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Files
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Download Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Download Period
                </h4>
                <p className="text-sm text-gray-500 mt-1">Your downloads are available for 7 days after purchase.</p>
              </div>
              <div>
                <h4 className="font-medium flex items-center">
                  <Download className="h-4 w-4 mr-2" /> Download Limit
                </h4>
                <p className="text-sm text-gray-500 mt-1">Each product can be downloaded up to 10 times.</p>
              </div>
              <div>
                <h4 className="font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" /> License Usage
                </h4>
                <p className="text-sm text-gray-500 mt-1">Please respect the license terms for each product.</p>
              </div>
              <div>
                <h4 className="font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" /> Need Help?
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Contact our support team if you have any issues with your downloads.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
