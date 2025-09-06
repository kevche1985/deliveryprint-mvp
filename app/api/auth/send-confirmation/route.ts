import { NextRequest, NextResponse } from 'next/server'
import { resendEmailManager } from '@/lib/resend-email-manager'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, userName } = await request.json()

    if (!userId || !email || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await resendEmailManager.sendConfirmationEmail(userId, email, userName)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send-confirmation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}