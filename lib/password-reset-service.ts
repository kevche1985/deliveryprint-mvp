import { createClient } from '@supabase/supabase-js'
import { emailService } from './email-service'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class PasswordResetService {
  constructor() {
    // Use the singleton instance instead of creating a new one
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create a password reset token and send email
   */
  // Update methods to use emailService directly instead of this.emailService
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userError) {
        console.error('Error fetching users:', userError)
        return { success: false, message: 'An error occurred. Please try again.' }
      }

      const existingUser = user.users.find(u => u.email === email)
      
      if (!existingUser) {
        // Don't reveal if email exists or not for security
        return { 
          success: true, 
          message: 'If an account with that email exists, you will receive a password reset link.' 
        }
      }

      // Generate secure token
      const token = this.generateSecureToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      // Clean up any existing tokens for this user
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', existingUser.id)

      // Insert new token
      const { error: insertError } = await supabaseAdmin
        .from('password_reset_tokens')
        .insert({
          user_id: existingUser.id,
          token,
          email,
          expires_at: expiresAt.toISOString()
        })

      if (insertError) {
        console.error('Error inserting reset token:', insertError)
        return { success: false, message: 'An error occurred. Please try again.' }
      }

      // Send reset email
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
      
      // Replace this.emailService with emailService
      const emailSent = await emailService.sendPasswordResetEmail({
        email: existingUser.email!,
        userName: existingUser.user_metadata?.full_name || existingUser.email!,
        resetUrl,
        expiresAt: expiresAt.toLocaleString()
      })
    
      if (!emailSent) {
        return { success: false, message: 'Failed to send reset email. Please try again.' }
      }

      return { 
        success: true, 
        message: 'If an account with that email exists, you will receive a password reset link.' 
      }

    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, message: 'An error occurred. Please try again.' }
    }
  }

  /**
   * Verify reset token and get user info
   */
  async verifyResetToken(token: string): Promise<{ 
    valid: boolean; 
    userId?: string; 
    email?: string; 
    message: string 
  }> {
    try {
      const { data: tokenData, error } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null)
        .single()

      if (error || !tokenData) {
        return { valid: false, message: 'Invalid or expired reset token.' }
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return { valid: false, message: 'Reset token has expired. Please request a new one.' }
      }

      return {
        valid: true,
        userId: tokenData.user_id,
        email: tokenData.email,
        message: 'Token is valid.'
      }

    } catch (error) {
      console.error('Token verification error:', error)
      return { valid: false, message: 'An error occurred while verifying the token.' }
    }
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ 
    success: boolean; 
    message: string 
  }> {
    try {
      // Verify token first
      const tokenVerification = await this.verifyResetToken(token)
      
      if (!tokenVerification.valid || !tokenVerification.userId) {
        return { success: false, message: tokenVerification.message }
      }

      // Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenVerification.userId,
        { password: newPassword }
      )

      if (updateError) {
        console.error('Error updating password:', updateError)
        return { success: false, message: 'Failed to update password. Please try again.' }
      }

      // Mark token as used
      const { error: tokenUpdateError } = await supabaseAdmin
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)

      if (tokenUpdateError) {
        console.error('Error marking token as used:', tokenUpdateError)
        // Don't fail the request if we can't mark the token as used
      }

      return { 
        success: true, 
        message: 'Password has been reset successfully. You can now log in with your new password.' 
      }

    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, message: 'An error occurred while resetting the password.' }
    }
  }

  /**
   * Clean up expired tokens (call this periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('cleanup_expired_password_reset_tokens')

      if (error) {
        console.error('Error cleaning up expired tokens:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Cleanup error:', error)
      return 0
    }
  }
}

export const passwordResetService = new PasswordResetService()