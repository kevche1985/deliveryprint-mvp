import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailService } from '@/lib/email-service'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists and is not confirmed
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'Email already confirmed' },
        { status: 400 }
      )
    }

    // Generate confirmation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in database
    const { error: tokenError } = await supabaseAdmin
      .from('email_confirmation_tokens')
      .upsert({
        user_id: user.id,
        email: email,
        token: token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (tokenError) {
      console.error('Error storing confirmation token:', tokenError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate confirmation token' },
        { status: 500 }
      )
    }

    // Send confirmation email using your existing email service
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/confirm-email?token=${token}&email=${encodeURIComponent(email)}`
    
    const emailSent = await emailService.sendEmail({
      template_key: 'email_confirmation',
      recipient_email: email,
      recipient_name: user.user_metadata?.first_name || email,
      template_data: {
        user_name: user.user_metadata?.first_name || 'User',
        confirmation_url: confirmationUrl,
        site_name: 'DeliveryPrint'
      }
    })

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully'
    })

  } catch (error) {
    console.error('Resend confirmation API error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}