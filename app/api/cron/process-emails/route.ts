import { NextRequest, NextResponse } from 'next/server'
import { emailConfirmationService } from '@/lib/email-confirmation-service'

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await emailConfirmationService.processConfirmationEmails()
    await emailConfirmationService.processWelcomeEmails()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process emails' }, { status: 500 })
  }
}