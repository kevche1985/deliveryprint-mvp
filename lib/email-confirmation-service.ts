import { createClient } from '@supabase/supabase-js'
import { EmailServerService } from './email-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const emailService = new EmailServerService()

export class EmailConfirmationService {
  async processConfirmationEmails() {
    try {
      // Get pending confirmation emails
      const { data: pendingEmails, error } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('template_key', 'email_confirmation')
        .eq('status', 'pending')
        .limit(10)

      if (error) {
        console.error('Error fetching pending emails:', error)
        return
      }

      for (const email of pendingEmails) {
        try {
          await this.sendConfirmationEmail(email)
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing confirmation emails:', error)
    }
  }

  async processWelcomeEmails() {
    try {
      // Get pending welcome emails
      const { data: pendingEmails, error } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('template_key', 'welcome_email')
        .eq('status', 'pending')
        .limit(10)

      if (error) {
        console.error('Error fetching pending welcome emails:', error)
        return
      }

      for (const email of pendingEmails) {
        try {
          await this.sendWelcomeEmail(email)
        } catch (error) {
          console.error(`Failed to send welcome email ${email.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing welcome emails:', error)
    }
  }

  private async sendConfirmationEmail(emailLog: any) {
    const templateData = emailLog.metadata?.template_data || {}
    
    const success = await emailService.sendEmail({
      template_key: 'email_confirmation',
      recipient_email: emailLog.recipient_email,
      recipient_name: emailLog.recipient_name,
      template_data: templateData
    })

    // Update email log status
    await supabaseAdmin
      .from('email_logs')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        error_message: success ? null : 'Failed to send via Resend'
      })
      .eq('id', emailLog.id)
  }

  private async sendWelcomeEmail(emailLog: any) {
    const templateData = emailLog.metadata?.template_data || {}
    
    const success = await emailService.sendEmail({
      template_key: 'welcome_email',
      recipient_email: emailLog.recipient_email,
      recipient_name: emailLog.recipient_name,
      template_data: templateData
    })

    // Update email log status
    await supabaseAdmin
      .from('email_logs')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        error_message: success ? null : 'Failed to send via Resend'
      })
      .eq('id', emailLog.id)
  }

  async confirmEmail(token: string, email: string) {
    try {
      // Decode email
      const decodedEmail = Buffer.from(email, 'base64url').toString()
      
      // Find user with this token
      const { data: user, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        throw new Error('Failed to fetch users')
      }

      const targetUser = user.users.find(u => 
        u.email === decodedEmail && 
        u.user_metadata?.confirmation_token === token
      )

      if (!targetUser) {
        throw new Error('Invalid confirmation token')
      }

      // Check if token is expired (24 hours)
      const sentAt = new Date(targetUser.user_metadata?.confirmation_sent_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        throw new Error('Confirmation token has expired')
      }

      // Confirm the user
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { email_confirm: true }
      )

      if (confirmError) {
        throw new Error('Failed to confirm user')
      }

      return { success: true, message: 'Email confirmed successfully' }
    } catch (error) {
      console.error('Email confirmation error:', error)
      return { success: false, message: error instanceof Error ? error.message : 'Confirmation failed' }
    }
  }
}

export const emailConfirmationService = new EmailConfirmationService()