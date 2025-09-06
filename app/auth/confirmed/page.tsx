"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function EmailConfirmedPage() {
  useEffect(() => {
    // Trigger welcome email processing
    fetch('/api/email/process-confirmation', { method: 'POST' })
      .catch(err => console.error('Failed to trigger welcome email:', err))
  }, [])

  // Add auto-login logic after confirmation
  useEffect(() => {
    const handleConfirmation = async () => {
      // Trigger welcome email processing
      fetch('/api/email/process-confirmation', { method: 'POST' })
        .catch(err => console.error('Failed to trigger welcome email:', err))
      
      if (result.success && result.loginUrl) {
        // Redirect to auto-login URL
        window.location.href = result.loginUrl
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle>Email confirmed!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You can now access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}