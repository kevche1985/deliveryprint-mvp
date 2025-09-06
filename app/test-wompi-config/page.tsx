"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TestWompiConfigPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Add this to the component state or constants section
  const clientSideEnvVars = {
    NEXT_PUBLIC_WOMPI_CLIENT_ID: process.env.NEXT_PUBLIC_WOMPI_CLIENT_ID || "Not set",
    NEXT_PUBLIC_WOMPI_CLIENT_SECRET: process.env.NEXT_PUBLIC_WOMPI_CLIENT_SECRET || "Not set",
    NEXT_PUBLIC_WOMPI_BASE_URL: process.env.NEXT_PUBLIC_WOMPI_BASE_URL || "Not set",
  }

  const testConfiguration = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/payments/wompi/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          useRedirectUri: true,
          testMode: true,
        }),
      })

      const data = await response.json()
      setResults(data)
    } catch (error: any) {
      setResults({
        success: false,
        error: error.message,
        clientError: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Set":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Missing":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Set":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Set
          </Badge>
        )
      case "Missing":
        return <Badge variant="destructive">Missing</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wompi Configuration Test</h1>
          <p className="text-gray-600">Test your Wompi payment integration configuration</p>
        </div>

        <div className="space-y-6">
          {/* Client-Side Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Client-Side Environment Variables</CardTitle>
              <p className="text-sm text-yellow-600">⚠️ These are visible in the browser</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(clientSideEnvVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(value !== "Not set" ? "Set" : "Not set")}
                      <span className="font-mono text-sm">{key}</span>
                    </div>
                    {getStatusBadge(value !== "Not set" ? "Set" : "Not set")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Button */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testConfiguration} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Configuration...
                  </>
                ) : (
                  "Test Wompi Configuration"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <>
              {/* Environment Variables Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Environment Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.environment ? (
                    <div className="space-y-3">
                      {Object.entries(results.environment).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(value as string)}
                            <span className="font-mono text-sm">{key}</span>
                          </div>
                          {getStatusBadge(value as string)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-600">Environment variables not available</p>
                  )}
                </CardContent>
              </Card>

              {/* API Response */}
              <Card>
                <CardHeader>
                  <CardTitle>API Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Status:</span>
                      <Badge variant={results.success ? "default" : "destructive"}>
                        {results.status || "Unknown"} - {results.statusText || "No status text"}
                      </Badge>
                    </div>

                    {results.parsedBody && (
                      <div>
                        <h4 className="font-semibold mb-2">Parsed JSON Response:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                          {JSON.stringify(results.parsedBody, null, 2)}
                        </pre>
                      </div>
                    )}

                    {results.parseError && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Parse Error:</h4>
                        <p className="text-red-600">{results.parseError}</p>
                      </div>
                    )}

                    {results.body && (
                      <div>
                        <h4 className="font-semibold mb-2">Raw Response Body:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">{results.body}</pre>
                      </div>
                    )}

                    {results.error && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
                        <p className="text-red-600">{results.error}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Headers */}
              {results.headers && (
                <Card>
                  <CardHeader>
                    <CardTitle>Response Headers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                      {JSON.stringify(results.headers, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
