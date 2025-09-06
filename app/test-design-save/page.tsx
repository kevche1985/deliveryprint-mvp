"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TestDesignSave() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const testSimpleCreate = async () => {
    if (!user) {
      setError("Please log in first")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get auth token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error("Failed to get session")
      }

      const response = await fetch("/api/digital-products/test-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setResult(data)
    } catch (err: any) {
      console.error("Test error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const testFullDesignSave = async () => {
    if (!user) {
      setError("Please log in first")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Get auth token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error("Failed to get session")
      }

      // Create a simple base64 image (1x1 red pixel)
      const canvas = document.createElement("canvas")
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ff0000"
        ctx.fillRect(0, 0, 100, 100)
      }
      const testImageBase64 = canvas.toDataURL("image/png")

      const requestData = {
        id: `test_${Date.now()}`,
        name: `Test Design ${new Date().toISOString()}`,
        description: "Test design with actual image data",
        type: "image",
        file_data: {
          design_data: { test: true },
          formats: ["png", "pdf", "svg", "jpg"],
          canvas_data: testImageBase64,
        },
        generation_inputs: {
          test: true,
          user_email: user.email,
        },
        base_price: 15.0,
        preview_url: testImageBase64,
      }

      const response = await fetch("/api/digital-products/create-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestData),
      })

      const responseText = await response.text()
      console.log("Raw response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setResult(data)
    } catch (err: any) {
      console.error("Full test error:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Design Save</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>Please log in to test design saving functionality.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Design Save Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testSimpleCreate} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Simple Create"}
            </Button>
            <Button onClick={testFullDesignSave} disabled={isLoading} variant="outline">
              {isLoading ? "Testing..." : "Test Full Design Save"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <strong>Success!</strong>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
