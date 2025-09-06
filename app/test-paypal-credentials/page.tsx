"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestPayPalCredentials() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCredentials = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch("/api/payments/paypal/test-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to test credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>PayPal Credentials Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Test your PayPal sandbox credentials to ensure they are configured correctly.</p>

          <Button onClick={testCredentials} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Credentials...
              </>
            ) : (
              "Test PayPal Credentials"
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-500" : "border-red-500"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <div>
                      <p className="font-semibold text-green-700">✅ PayPal credentials are valid!</p>
                      <p className="text-sm text-gray-600 mt-1">Environment: {result.environment}</p>
                      <p className="text-sm text-gray-600">Token expires in: {result.expires_in} seconds</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-red-700">❌ PayPal credentials test failed</p>
                      <p className="text-sm text-gray-600 mt-1">Error: {result.error}</p>
                      {result.details && <p className="text-sm text-gray-600">Details: {result.details}</p>}
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">To fix this:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>
                            Go to{" "}
                            <a
                              href="https://developer.paypal.com/developer/applications/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              PayPal Developer Dashboard
                            </a>
                          </li>
                          <li>Create a new sandbox app or use an existing one</li>
                          <li>Copy the Client ID and Client Secret</li>
                          <li>
                            Update your environment variables:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>NEXT_PUBLIC_PAYPAL_CLIENT_ID</li>
                              <li>PAYPAL_CLIENT_SECRET</li>
                            </ul>
                          </li>
                          <li>Restart your development server</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
