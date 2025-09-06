"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TestDesignSaveDebug() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const runSizeTest = async () => {
    if (!user) {
      alert("Please log in first")
      return
    }

    setIsLoading(true)
    setTestResults(null)

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const authToken = session?.access_token

      // Create a small test payload
      const smallTestData = {
        id: "test-small",
        name: "Small Test Design",
        description: "Testing with small payload",
        type: "image",
        file_data: {
          canvas_data:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // 1x1 pixel
          design_data: { test: true },
          formats: ["png"],
        },
        generation_inputs: { test: true },
        base_price: 0,
      }

      console.log("Testing small payload...")
      const smallResponse = await fetch("/api/digital-products/test-size", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(smallTestData),
      })

      const smallResult = await smallResponse.json()

      // Create a larger test payload
      const largeBase64 = "data:image/png;base64," + "A".repeat(1024 * 1024) // ~1MB of A's
      const largeTestData = {
        ...smallTestData,
        id: "test-large",
        name: "Large Test Design",
        file_data: {
          ...smallTestData.file_data,
          canvas_data: largeBase64,
        },
      }

      console.log("Testing large payload...")
      let largeResult = null
      try {
        const largeResponse = await fetch("/api/digital-products/test-size", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(largeTestData),
        })
        largeResult = await largeResponse.json()
      } catch (error) {
        largeResult = { error: error instanceof Error ? error.message : "Unknown error" }
      }

      setTestResults({
        small: smallResult,
        large: largeResult,
        userInfo: {
          userId: user.id,
          email: user.email,
          hasAuthToken: !!authToken,
        },
      })
    } catch (error) {
      console.error("Test error:", error)
      setTestResults({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Design Save Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runSizeTest} disabled={isLoading || !user}>
              {isLoading ? "Testing..." : "Run Size Test"}
            </Button>
          </div>

          {!user && <div className="text-red-600">Please log in to run tests</div>}

          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
