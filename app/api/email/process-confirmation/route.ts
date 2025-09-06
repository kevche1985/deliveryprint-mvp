import { NextResponse } from 'next/server'
import { emailConfirmationService } from '@/lib/email-confirmation-service'

export async function POST() {
  try {
    await emailConfirmationService.processConfirmationEmails()
    await emailConfirmationService.processWelcomeEmails()
    
    return NextResponse.json({ success: true, message: 'Emails processed' })
  } catch (error) {
    console.error('Email processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process emails' },
      { status: 500 }
    )
  }
}