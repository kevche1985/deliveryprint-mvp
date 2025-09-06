import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface EmailTemplate {
  template_key: string
  template_name: string
  subject_template: string
  html_template: string
  text_template?: string
  variables: string[]
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export class ResendEmailManager {
  private fromEmail = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
  private fromName = 'DeliveryPrint'

  /**
   * Send email using Resend API
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await resend.emails.send({
        from: emailData.from || `${this.fromName} <${this.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      if (error) {
        console.error('Resend API error:', error)
        return { success: false, error: error.message }
      }

      console.log('Email sent successfully:', data?.id)
      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Email sending error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get email template from database
   */
  async getTemplate(templateKey: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.error('Template not found:', templateKey, error)
        return null
      }

      return data as EmailTemplate
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }

  /**
   * Render template with data
   */
  renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value || ''))
    }
    return rendered
  }

  /**
   * Send templated email
   */
  async sendTemplatedEmail(
    templateKey: string,
    to: string,
    templateData: Record<string, any>,
    recipientName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get template
      const template = await this.getTemplate(templateKey)
      if (!template) {
        return { success: false, error: `Template not found: ${templateKey}` }
      }

      // Render template
      const subject = this.renderTemplate(template.subject_template, templateData)
      const html = this.renderTemplate(template.html_template, templateData)
      const text = template.text_template ? this.renderTemplate(template.text_template, templateData) : undefined

      // Send email
      const result = await this.sendEmail({
        to,
        subject,
        html,
        text,
      })

      // Log email
      await this.logEmail({
        template_key: templateKey,
        recipient_email: to,
        recipient_name: recipientName,
        subject,
        status: result.success ? 'sent' : 'failed',
        message_id: result.messageId,
        error_message: result.error,
        metadata: { template_data: templateData },
      })

      return result
    } catch (error) {
      console.error('Error sending templated email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log email to database
   */
  async logEmail(logData: {
    template_key: string
    recipient_email: string
    recipient_name?: string
    subject: string
    status: string
    message_id?: string
    error_message?: string
    metadata?: any
  }): Promise<void> {
    try {
      await supabaseAdmin.from('email_logs').insert({
        template_key: logData.template_key,
        recipient_email: logData.recipient_email,
        recipient_name: logData.recipient_name,
        subject: logData.subject,
        status: logData.status,
        message_id: logData.message_id,
        error_message: logData.error_message,
        sent_at: logData.status === 'sent' ? new Date().toISOString() : null,
        metadata: logData.metadata,
      })
    } catch (error) {
      console.error('Error logging email:', error)
    }
  }

  /**
   * Generate email confirmation token and send confirmation email
   */
  async sendConfirmationEmail(userId: string, email: string, userName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store token in database
      const { error: tokenError } = await supabaseAdmin
        .from('email_confirmation_tokens')
        .insert({
          user_id: userId,
          email,
          token,
          expires_at: expiresAt.toISOString(),
        })

      if (tokenError) {
        console.error('Error storing confirmation token:', tokenError)
        return { success: false, error: 'Failed to generate confirmation token' }
      }

      // Create confirmation URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const confirmationUrl = `${baseUrl}/api/auth/confirm-email?token=${token}&email=${encodeURIComponent(email)}`

      // Send confirmation email
      const result = await this.sendTemplatedEmail(
        'email_confirmation',
        email,
        {
          user_name: userName,
          confirmation_url: confirmationUrl,
        },
        userName
      )

      return result
    } catch (error) {
      console.error('Error sending confirmation email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Verify and confirm email token
   */
  async confirmEmailToken(token: string, email: string) {
    try {
      console.log('🔍 Starting email confirmation process')
      console.log('🔍 Token (first 8 chars):', token.substring(0, 8) + '...')
      console.log('🔍 Email:', email)
      
      // Find valid token
      console.log('🔍 Querying email_confirmation_tokens table...')
      const { data: tokenData, error } = await supabaseAdmin
        .from('email_confirmation_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .is('used_at', null)
        .single()
    
      console.log('🔍 Token query result:')
      console.log('  - Data:', tokenData)
      console.log('  - Error:', error)
      console.log('  - Error code:', error?.code)
      console.log('  - Error message:', error?.message)
    
      if (error || !tokenData) {
        console.log('❌ Token not found or query error')
        if (error?.code === 'PGRST116') {
          console.log('❌ No rows returned - token/email combination not found')
        }
        return { success: false, error: 'Invalid or expired confirmation token' }
      }
    
      // Check if token is expired
      const now = new Date()
      const expiresAt = new Date(tokenData.expires_at)
      console.log('🔍 Token expiry check:')
      console.log('  - Current time:', now.toISOString())
      console.log('  - Token expires at:', expiresAt.toISOString())
      console.log('  - Is expired:', expiresAt < now)
      
      if (expiresAt < now) {
        console.log('❌ Token has expired')
        return { success: false, error: 'Confirmation token has expired' }
      }
    
      // Mark token as used
      console.log('🔍 Marking token as used...')
      const { error: updateError } = await supabaseAdmin
        .from('email_confirmation_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id)
      
      console.log('🔍 Token update result:')
      console.log('  - Update error:', updateError)
      
      if (updateError) {
        console.log('❌ Failed to mark token as used:', updateError)
      }
    
      // Confirm user email in Supabase Auth
      // Replace lines 276-279 with this approach
      console.log('🔍 Updating user email_confirm status...')
      console.log('🔍 User ID:', tokenData.user_id)
      
      // Instead of directly updating email_confirm, we'll use the auth admin API
      const { data: updateResult, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id,
        { 
          email_confirmed_at: new Date().toISOString(),
          user_metadata: { email_confirmed: true }
        }
      )
    
      console.log('🔍 Supabase Auth update result:')
      console.log('  - Update data:', updateResult)
      console.log('  - Confirm error:', confirmError)
      console.log('  - Error message:', confirmError?.message)
    
      if (confirmError) {
        console.error('❌ Error confirming user email in Supabase Auth:', confirmError)
        return { success: false, error: 'Failed to confirm email' }
      }
    
      console.log('✅ Email confirmation successful!')
      
      // Create user profile after successful email confirmation
      console.log('🔍 Creating user profile...')
      try {
        // Get user data from Supabase Auth to extract name information
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id)
        
        if (userError) {
          console.log('⚠️ Could not fetch user data for profile creation:', userError)
        }
        
        // Extract first and last name from user metadata or email
        const userMetadata = userData?.user?.user_metadata || {}
        const email = userData?.user?.email || tokenData.email
        const firstName = userMetadata.first_name || userMetadata.firstName || email.split('@')[0]
        const lastName = userMetadata.last_name || userMetadata.lastName || ''
        
        // Check if user profile already exists
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('id', tokenData.user_id)
          .single()
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.log('⚠️ Error checking existing profile:', checkError)
        }
        
        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              id: tokenData.user_id,
              first_name: firstName,
              last_name: lastName,
              role: 'customer',
              status: 'active'
            })
          
          if (profileError) {
            console.error('❌ Error creating user profile:', profileError)
            // Don't fail the confirmation if profile creation fails
          } else {
            console.log('✅ User profile created successfully!')
          }
        } else {
          console.log('ℹ️ User profile already exists')
        }
      } catch (profileCreationError) {
        console.error('❌ Unexpected error creating user profile:', profileCreationError)
        // Don't fail the confirmation if profile creation fails
      }
      
      // Log successful email confirmation
      await this.logEmail({
        template_key: 'email_confirmation_success',
        recipient_email: email,
        recipient_name: tokenData.user_id,
        subject: 'Email Confirmation Successful',
        status: 'success',
        metadata: {
          user_id: tokenData.user_id,
          token_id: tokenData.id,
          confirmed_at: new Date().toISOString()
        }
      })
      
      return { success: true, userId: tokenData.user_id }
      
      // After successful confirmation, create a session
      const { data: signInData, error: signInError } = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: decodedEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
        }
      })
      
      if (signInError) {
        console.error('Error generating login link:', signInError)
      }
      
      // Return the magic link for auto-login
      return {
        success: true,
        message: 'Email confirmed successfully',
        userId: user.id,
        loginUrl: signInData?.properties?.action_link
      }
    } catch (error) {
      console.error('❌ Unexpected error in confirmEmailToken:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.sendTemplatedEmail(
      'test_email',
      to,
      {
        test_message: 'This is a test email from your Resend integration',
        timestamp: new Date().toISOString(),
        admin_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
      }
    )

    return result
  }
}

export const resendEmailManager = new ResendEmailManager()