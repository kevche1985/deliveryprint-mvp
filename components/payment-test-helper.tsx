"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle, XCircle, RotateCcw } from "lucide-react"

export default function PaymentTestHelper() {
  const testCards = [
    {
      number: "4111 1111 1111 1234",
      scenario: "Success",
      description: "Payment completes successfully",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      color: "bg-green-50 border-green-200",
    },
    {
      number: "4111 1111 1111 1111",
      scenario: "3DS Required",
      description: "Redirects to 3DS authentication",
      icon: <RotateCcw className="h-4 w-4 text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      number: "4111 1111 1111 0000",
      scenario: "Payment Failure",
      description: "Simulates insufficient funds",
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      color: "bg-red-50 border-red-200",
    },
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Testing Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Use these test card numbers to simulate different payment scenarios in the checkout:
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
                  {card.number}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Additional Test Data:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>Expiry:</strong> Any future date (e.g., 12/25)
            </li>
            <li>
              • <strong>CVV:</strong> Any 3-4 digit number (e.g., 123)
            </li>
            <li>
              • <strong>Name:</strong> Any cardholder name
            </li>
            <li>
              • <strong>Region:</strong> Any El Salvador region
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
