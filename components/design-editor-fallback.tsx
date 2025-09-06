"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DesignEditorFallback() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Design Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Design Editor</AlertTitle>
          <AlertDescription>
            We couldn't load the design editor. This might be due to browser compatibility issues.
          </AlertDescription>
        </Alert>

        <div className="text-center py-8">
          <p className="mb-4">Please try one of the following:</p>
          <ul className="text-left inline-block mb-6">
            <li className="mb-2">• Refresh the page</li>
            <li className="mb-2">• Try using a different browser (Chrome or Firefox recommended)</li>
            <li className="mb-2">• Disable any browser extensions that might be interfering</li>
          </ul>
          <Button onClick={() => window.location.reload()} className="bg-[#8B0000] hover:bg-[#6B0000]">
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
