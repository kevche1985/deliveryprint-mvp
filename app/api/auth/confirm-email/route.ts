import { NextRequest, NextResponse } from 'next/server'
import { resendEmailManager } from '@/lib/resend-email-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(
      new URL('/auth/confirmation-error?error=Invalid confirmation link', request.url)
    )
  }

  try {
    const result = await resendEmailManager.confirmEmailToken(token, email)

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/confirmation-error?error=${encodeURIComponent(result.error || 'Confirmation failed')}`, request.url)
      )
    }

    return NextResponse.redirect(new URL('/auth/confirmed', request.url))
  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(
      new URL('/auth/confirmation-error?error=An error occurred', request.url)
    )
  }
}