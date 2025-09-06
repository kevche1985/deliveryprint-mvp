"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Textarea } from "@/components/ui/textarea"

export default function TestOrderAccessPage() {
  const { user, profile } = useAuth()
  const [orderId, setOrderId] = useState("2ae60ce5-46dc-4863-a284-e3168b350b36")
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testOrderAccess = async () => {
    if (!user?.id) {
      alert("Please log in first")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/debug/order-access?orderId=${orderId}&userId=${user.id}`)
      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugResult({ error: "Failed to run debug" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Order Access Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current User ID</Label>
              <Input value={user?.id || "Not logged in"} readOnly />
            </div>
            <div>
              <Label>User Role</Label>
              <Input value={profile?.role || "Unknown"} readOnly />
            </div>
          </div>
          
          <div>
            <Label>Order ID to Test</Label>
            <Input 
              value={orderId} 
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter order ID"
            />
          </div>
          
          <Button 
            onClick={testOrderAccess} 
            disabled={loading || !user?.id}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Order Access"}
          </Button>
          
          {debugResult && (
            <div>
              <Label>Debug Result</Label>
              <Textarea 
                value={JSON.stringify(debugResult, null, 2)} 
                readOnly 
                className="h-96 font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}