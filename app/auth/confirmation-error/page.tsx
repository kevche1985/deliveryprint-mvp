'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmationErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unknown error occurred'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-6 text-2xl font-bold text-gray-900">
              Email Confirmation Failed
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-600">
              We encountered an issue while confirming your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {decodeURIComponent(error)}
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This could happen if:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>The confirmation link has expired</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/register">
                  Request New Confirmation Email
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>
              
              <Button variant="ghost" asChild className="w-full">
                <Link href="/">
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ConfirmationErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationErrorContent />
    </Suspense>
  )
}