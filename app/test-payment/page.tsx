"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, CreditCard, AlertCircle } from "lucide-react"

export default function TestPaymentPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testCards = [
    {
      number: "4111111111111234",
      scenario: "Success",
      description: "Payment completes successfully",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      color: "bg-green-50 border-green-200",
    },
    {
      number: "4111111111111111",
      scenario: "3DS Required",
      description: "Redirects to 3DS authentication",
      icon: <RotateCcw className="h-4 w-4 text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      number: "4111111111110000",
      scenario: "Payment Failure",
      description: "Simulates insufficient funds",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      color: "bg-red-50 border-red-200",
    },
  ]

  const testEnvironment = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/payments/wompi/test-env")
      const result = await response.json()
      setTestResults(result)
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : "Test failed" })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment System Test Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testEnvironment} disabled={testing}>
                {testing ? "Testing..." : "Test Environment"}
              </Button>
            </div>

            {testResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Environment Test Results:</h4>
                <pre className="text-sm overflow-auto">{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Card Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Use these test card numbers in the checkout to simulate different payment scenarios:
            </p>

            <div className="grid gap-3">
              {testCards.map((card, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${card.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {card.icon}
                      <span className="font-medium">{card.scenario}</span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {card.number.replace(/(.{4})/g, "$1 ").trim()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Testing Instructions:</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>1. Add products to cart from the products page</li>
                    <li>2. Proceed to checkout and fill billing information</li>
                    <li>3. Select "Wompi Payment" as payment method</li>
                    <li>4. Use one of the test card numbers above</li>
                    <li>5. Use any future expiry date (e.g., 12/25) and CVV (e.g., 123)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Required Variables:</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ WOMPI_BASE_URL</li>
                  <li>✅ WOMPI_BASE_ACCESS_URL</li>
                  <li>✅ WOMPI_CLIENT_ID</li>
                  <li>✅ WOMPI_CLIENT_SECRET</li>
                  <li>✅ WOMPI_WEBHOOK_SECRET</li>
                  <li>✅ NEXT_PUBLIC_SITE_URL</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Database Tables:</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ wompi_transactions</li>
                  <li>✅ wompi_tokens</li>
                  <li>✅ orders</li>
                  <li>✅ products</li>
                  <li>✅ users</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
