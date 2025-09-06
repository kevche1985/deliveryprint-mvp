"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPayPalPage() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>PayPal Configuration Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Client ID Status:</strong> {clientId ? "✅ Set" : "❌ Missing"}
            </div>
            {clientId && (
              <div>
                <strong>Client ID:</strong> {clientId.substring(0, 20)}...
              </div>
            )}
            <div>
              <strong>SDK URL:</strong>
              <br />
              <code className="text-sm bg-gray-100 p-2 rounded block mt-1">
                {`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
