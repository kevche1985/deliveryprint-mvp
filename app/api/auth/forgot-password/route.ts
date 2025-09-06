import { NextRequest, NextResponse } from 'next/server'
import { passwordResetService } from '@/lib/password-reset-service'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = forgotPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Rate limiting check (simple implementation)
    // In production, use a proper rate limiting solution
    const rateLimitKey = `forgot_password_${email}`
    // You could implement Redis-based rate limiting here

    const result = await passwordResetService.requestPasswordReset(email)

    return NextResponse.json({
      success: result.success,
      message: result.message
    })

  } catch (error) {
    console.error('Forgot password API error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}