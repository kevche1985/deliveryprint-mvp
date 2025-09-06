"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TestApiDebug() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (test: string, success: boolean, data: any) => {
    setResults((prev) => [...prev, { test, success, data, timestamp: new Date().toISOString() }])
  }

  const testSimpleInsert = async () => {
    setIsLoading(true)
    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        addResult("Simple Insert", false, { error: "Not authenticated" })
        return
      }

      const response = await fetch("/api/digital-products/test-simple-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          test: "simple",
          data: "minimal payload",
        }),
      })

      const result = await response.json()
      addResult("Simple Insert", response.ok, result)
    } catch (error) {
      addResult("Simple Insert", false, { error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const testLargePayload = async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        addResult("Large Payload", false, { error: "Not authenticated" })
        return
      }

      // Create a large base64 string (simulate image data)
      const largeData = "data:image/png;base64," + "A".repeat(1024 * 1024) // 1MB of A's

      const response = await fetch("/api/digital-products/test-simple-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          test: "large",
          canvas_data: largeData,
          design_data: {
            elements: Array(100)
              .fill(0)
              .map((_, i) => ({
                id: i,
                type: "text",
                content: `Element ${i}`,
                x: i * 10,
                y: i * 10,
              })),
          },
        }),
      })

      const result = await response.json()
      addResult("Large Payload (1MB)", response.ok, result)
    } catch (error) {
      addResult("Large Payload", false, { error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const testVeryLargePayload = async () => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        addResult("Very Large Payload", false, { error: "Not authenticated" })
        return
      }

      // Create a very large base64 string (simulate large image)
      const veryLargeData = "data:image/png;base64," + "B".repeat(5 * 1024 * 1024) // 5MB

      const response = await fetch("/api/digital-products/test-simple-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          test: "very_large",
          canvas_data: veryLargeData,
        }),
      })

      const result = await response.json()
      addResult("Very Large Payload (5MB)", response.ok, result)
    } catch (error) {
      addResult("Very Large Payload", false, { error: error instanceof Error ? error.message : String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">API Debug Tests</h1>

      <div className="grid gap-4 mb-6">
        <Button onClick={testSimpleInsert} disabled={isLoading}>
          Test Simple Insert
        </Button>
        <Button onClick={testLargePayload} disabled={isLoading}>
          Test Large Payload (1MB)
        </Button>
        <Button onClick={testVeryLargePayload} disabled={isLoading}>
          Test Very Large Payload (5MB)
        </Button>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      {isLoading && (
        <Alert className="mb-4">
          <AlertDescription>Running test...</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className={`text-lg ${result.success ? "text-green-600" : "text-red-600"}`}>
                {result.test} - {result.success ? "SUCCESS" : "FAILED"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-2">{result.timestamp}</div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
