"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function CheckEmailContent() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage("Email address not found. Please try signing up again.")
      return
    }

    setIsResending(true)
    setResendMessage("")

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setResendMessage("Confirmation email sent! Please check your inbox.")
      } else {
        setResendMessage(data.error || "Failed to resend email. Please try again.")
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to your email address. Please click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            <p>Didn't receive the email? Check your spam folder or</p>
            <Button 
              variant="link" 
              className="p-0 h-auto"
              onClick={handleResendEmail}
              disabled={isResending || !email}
            >
              {isResending ? "Sending..." : "resend confirmation email"}
            </Button>
            {resendMessage && (
              <p className={`mt-2 text-sm ${
                resendMessage.includes('sent') ? 'text-green-600' : 'text-red-600'
              }`}>
                {resendMessage}
              </p>
            )}
          </div>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  )
}