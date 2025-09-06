"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, Shield, Eye } from "lucide-react"

export default function TestWompiCompletePage() {
  const [loading, setLoading] = useState(false)
  const [serverResults, setServerResults] = useState<any>(null)
  const [clientResults, setClientResults] = useState<any>(null)

  // Client-side environment variables (visible in browser)
  const clientEnvVars = {
    NEXT_PUBLIC_WOMPI_CLIENT_ID: process.env.NEXT_PUBLIC_WOMPI_CLIENT_ID || "Not set",
    NEXT_PUBLIC_WOMPI_CLIENT_SECRET: process.env.NEXT_PUBLIC_WOMPI_CLIENT_SECRET || "Not set",
    NEXT_PUBLIC_WOMPI_BASE_URL: process.env.NEXT_PUBLIC_WOMPI_BASE_URL || "Not set",
  }

  const testServerSideAuth = async () => {
    setLoading(true)
    setServerResults(null)

    try {
      console.log("🔐 Testing server-side OAuth with secure credentials...")

      const response = await fetch("/api/payments/wompi/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testType: "server-auth",
          useRedirectUri: true,
        }),
      })

      const data = await response.json()
      setServerResults(data)
      console.log("🔐 Server-side test result:", data)
    } catch (error: any) {
      setServerResults({
        success: false,
        error: error.message,
        clientError: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const testClientSideAuth = async () => {
    setLoading(true)
    setClientResults(null)

    try {
      console.log("🌐 Testing client-side OAuth (for debugging only)...")

      if (!clientEnvVars.NEXT_PUBLIC_WOMPI_CLIENT_ID || !clientEnvVars.NEXT_PUBLIC_WOMPI_CLIENT_SECRET) {
        throw new Error("Client-side credentials not available")
      }

      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientEnvVars.NEXT_PUBLIC_WOMPI_CLIENT_ID,
        client_secret: clientEnvVars.NEXT_PUBLIC_WOMPI_CLIENT_SECRET,
        scope: "payments",
      })

      const response = await fetch("https://id.wompi.sv/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      })

      const responseText = await response.text()
      console.log("🌐 Client-side OAuth response:", responseText)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch (e) {
        parsedResponse = null
      }

      setClientResults({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        parsedBody: parsedResponse,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error: any) {
      setClientResults({
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
      case "Not set":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Set":
        return <Badge className="bg-green-100 text-green-800">Set</Badge>
      case "Not set":
        return <Badge variant="destructive">Not set</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Wompi Integration Test</h1>
          <p className="text-gray-600">Test both client-side and server-side Wompi authentication</p>
        </div>

        <div className="space-y-6">
          {/* Security Warning */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Client secrets should only be used server-side in production. The
              NEXT_PUBLIC_WOMPI_CLIENT_SECRET is exposed in the browser and should only be used for testing.
            </AlertDescription>
          </Alert>

          {/* Environment Variables Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Client-Side Environment Variables
              </CardTitle>
              <p className="text-sm text-yellow-600">⚠️ These are visible in the browser</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(clientEnvVars).map(([key, value]) => (
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

          {/* Test Tabs */}
          <Tabs defaultValue="server" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="server" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Server-Side Test
              </TabsTrigger>
              <TabsTrigger value="client" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Client-Side Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="server" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Server-Side OAuth Test</CardTitle>
                  <p className="text-sm text-gray-600">
                    Tests OAuth using secure server-side credentials (recommended for production)
                  </p>
                </CardHeader>
                <CardContent>
                  <Button onClick={testServerSideAuth} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Server-Side Auth...
                      </>
                    ) : (
                      "Test Server-Side OAuth"
                    )}
                  </Button>

                  {serverResults && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <Badge variant={serverResults.success ? "default" : "destructive"}>
                          {serverResults.success ? "Success" : "Failed"}
                        </Badge>
                      </div>

                      {serverResults.environment && (
                        <div>
                          <h4 className="font-semibold mb-2">Server Environment Variables:</h4>
                          <div className="space-y-2">
                            {Object.entries(serverResults.environment).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="font-mono text-sm">{key}</span>
                                {getStatusBadge(value as string)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {serverResults.parsedBody && (
                        <div>
                          <h4 className="font-semibold mb-2">OAuth Response:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(serverResults.parsedBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      {serverResults.body && !serverResults.parsedBody && (
                        <div>
                          <h4 className="font-semibold mb-2">Raw Response:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                            {serverResults.body}
                          </pre>
                        </div>
                      )}

                      {serverResults.error && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
                          <p className="text-red-600">{serverResults.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client-Side OAuth Test</CardTitle>
                  <p className="text-sm text-yellow-600">⚠️ For debugging only - exposes credentials in browser</p>
                </CardHeader>
                <CardContent>
                  <Button onClick={testClientSideAuth} disabled={loading} variant="outline" className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Client-Side Auth...
                      </>
                    ) : (
                      "Test Client-Side OAuth (Debug Only)"
                    )}
                  </Button>

                  {clientResults && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <Badge variant={clientResults.success ? "default" : "destructive"}>
                          {clientResults.status || "Unknown"} - {clientResults.statusText || "No status"}
                        </Badge>
                      </div>

                      {clientResults.parsedBody && (
                        <div>
                          <h4 className="font-semibold mb-2">Parsed JSON Response:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(clientResults.parsedBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      {clientResults.body && !clientResults.parsedBody && (
                        <div>
                          <h4 className="font-semibold mb-2">Raw Response Body:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-64">
                            {clientResults.body}
                          </pre>
                        </div>
                      )}

                      {clientResults.headers && (
                        <div>
                          <h4 className="font-semibold mb-2">Response Headers:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(clientResults.headers, null, 2)}
                          </pre>
                        </div>
                      )}

                      {clientResults.error && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-600">Error:</h4>
                          <p className="text-red-600">{clientResults.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
