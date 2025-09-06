import { NextRequest, NextResponse } from 'next/server'
import { passwordResetService } from '@/lib/password-reset-service'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    const result = await passwordResetService.resetPassword(token, password)

    return NextResponse.json({
      success: result.success,
      message: result.message
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const validation = verifyTokenSchema.safeParse({ token })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    const result = await passwordResetService.verifyResetToken(token)

    return NextResponse.json({
      valid: result.valid,
      email: result.email,
      message: result.message
    })

  } catch (error) {
    console.error('Verify token API error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}