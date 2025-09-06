import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface EmailSettings {
  provider: string
  api_key?: string
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_password?: string
  from_email: string
  from_name: string
  admin_email?: string
  is_active: boolean
  email_enabled: boolean
  max_retry_attempts: number
  retry_delay_minutes: number
}

interface EmailTemplate {
  template_key: string
  template_name: string
  subject_template: string
  html_template: string
  text_template: string
  variables: string[]
}

interface SendEmailOptions {
  to: string
  toName?: string
  templateKey: string
  variables?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

class EmailService {
  private static instance: EmailService
  private settings: EmailSettings | null = null

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async getSettings(): Promise<EmailSettings> {
    if (!this.settings) {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to load email settings: ${error.message}`)
      }

      if (!data) {
        // Return default settings if none exist
        this.settings = {
          provider: "resend",
          api_key: "",
          from_email: "onboarding@resend.dev",
          from_name: "DeliveryPrint",
          admin_email: "",
          is_active: false,
          email_enabled: false,
          max_retry_attempts: 3,
          retry_delay_minutes: 5,
        }
      } else {
        this.settings = {
          provider: data.provider || "resend",
          api_key: data.api_key || "",
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_user: data.smtp_user,
          smtp_password: data.smtp_password,
          from_email: data.from_email || "onboarding@resend.dev",
          from_name: data.from_name || "DeliveryPrint",
          admin_email: data.admin_email || "",
          is_active: data.is_active || false,
          email_enabled: data.email_enabled || false,
          max_retry_attempts: data.max_retry_attempts || 3,
          retry_delay_minutes: data.retry_delay_minutes || 5,
        }
      }
    }

    return this.settings
  }

  async updateSettings(settings: Partial<EmailSettings>): Promise<void> {
    const { error } = await supabase.from("email_settings").upsert(
      {
        provider: settings.provider,
        api_key: settings.api_key,
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        from_email: settings.from_email,
        from_name: settings.from_name,
        admin_email: settings.admin_email,
        is_active: settings.is_active,
        email_enabled: settings.email_enabled || settings.is_active,
        max_retry_attempts: settings.max_retry_attempts,
        retry_delay_minutes: settings.retry_delay_minutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (error) {
      throw new Error(`Failed to update email settings: ${error.message}`)
    }

    // Clear cached settings
    this.settings = null
  }

  async getTemplate(templateKey: string): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single()

    if (error) {
      throw new Error(`Failed to load email template: ${error.message}`)
    }

    return data
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      result = result.replace(regex, String(value || ""))
    }
    return result
  }

  async sendEmail(options: SendEmailOptions): Promise<string> {
    try {
      const settings = await this.getSettings()

      if (!settings.email_enabled) {
        throw new Error("Email service is not active")
      }

      const template = await this.getTemplate(options.templateKey)

      // Replace variables in templates
      const subject = this.replaceVariables(template.subject_template, options.variables || {})
      const htmlContent = this.replaceVariables(template.html_template, options.variables || {})
      const textContent = this.replaceVariables(template.text_template, options.variables || {})

      let messageId: string

      if (settings.provider === "resend") {
        messageId = await this.sendWithResend(settings, {
          to: options.to,
          toName: options.toName,
          subject,
          html: htmlContent,
          text: textContent,
          attachments: options.attachments,
        })
      } else {
        throw new Error(`Email provider ${settings.provider} is not supported`)
      }

      // Log successful email
      await this.logEmail({
        template_key: options.templateKey,
        recipient_email: options.to,
        recipient_name: options.toName,
        subject,
        status: "sent",
        message_id: messageId,
      })

      return messageId
    } catch (error: any) {
      // Log failed email
      await this.logEmail({
        template_key: options.templateKey,
        recipient_email: options.to,
        recipient_name: options.toName,
        subject: "Failed to send",
        status: "failed",
        error_message: error.message,
      })

      throw error
    }
  }

  private async sendWithResend(
    settings: EmailSettings,
    emailData: {
      to: string
      toName?: string
      subject: string
      html: string
      text: string
      attachments?: Array<{
        filename: string
        content: Buffer | string
        contentType?: string
      }>
    },
  ): Promise<string> {
    if (!settings.api_key) {
      throw new Error("Resend API key is not configured")
    }

    const payload: any = {
      from: `${settings.from_name} <${settings.from_email}>`,
      to: emailData.toName ? [`${emailData.toName} <${emailData.to}>`] : [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    }

    if (emailData.attachments && emailData.attachments.length > 0) {
      payload.attachments = emailData.attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content.toString("base64") : att.content,
        type: att.contentType || "application/octet-stream",
      }))
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.api_key}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to send email via Resend")
    }

    const result = await response.json()
    return result.id
  }

  private async logEmail(logData: {
    template_key: string
    recipient_email: string
    recipient_name?: string
    subject: string
    status: "sent" | "failed" | "pending"
    message_id?: string
    error_message?: string
  }): Promise<void> {
    try {
      await supabase.from("email_logs").insert({
        ...logData,
        sent_at: logData.status === "sent" ? new Date().toISOString() : null,
      })
    } catch (error) {
      console.error("Failed to log email:", error)
      // Don't throw here as it would prevent the main email operation
    }
  }

  async testConnection(settings: EmailSettings): Promise<{ success: boolean; message: string }> {
    try {
      if (!settings.api_key) {
        return { success: false, message: "API key is required" }
      }

      if (settings.provider === "resend") {
        const response = await fetch("https://api.resend.com/domains", {
          headers: {
            Authorization: `Bearer ${settings.api_key}`,
          },
        })

        if (!response.ok) {
          const error = await response.json()
          return { success: false, message: `Connection failed: ${error.message}` }
        }

        return { success: true, message: "Connection successful" }
      }

      return { success: false, message: "Unsupported provider" }
    } catch (error: any) {
      return { success: false, message: `Connection test failed: ${error.message}` }
    }
  }

  async sendTestEmail(to: string, subject: string, message: string): Promise<string> {
    const settings = await this.getSettings()

    if (!settings.email_enabled) {
      throw new Error("Email service is not active")
    }

    if (!settings.api_key) {
      throw new Error("API key is not configured")
    }

    const html = `
      <h1>Test Email</h1>
      <p>${message}</p>
      <p>Sent at: ${new Date().toLocaleString()}</p>
    `

    const text = `Test Email\n\n${message}\n\nSent at: ${new Date().toLocaleString()}`

    return this.sendWithResend(settings, {
      to,
      subject,
      html,
      text,
    })
  }

  // Convenience methods for common email types
  async sendOrderConfirmation(orderData: {
    customerEmail: string
    customerName: string
    orderNumber: string
    orderTotal: string
    orderItems: Array<{
      name: string
      quantity: number
      price: string
    }>
  }): Promise<string> {
    return this.sendEmail({
      to: orderData.customerEmail,
      toName: orderData.customerName,
      templateKey: "order_confirmation",
      variables: {
        customer_name: orderData.customerName,
        order_number: orderData.orderNumber,
        order_total: orderData.orderTotal,
        order_items: orderData.orderItems,
        order_date: new Date().toLocaleDateString(),
      },
    })
  }

  async sendOrderStatusUpdate(orderData: {
    customerEmail: string
    customerName: string
    orderNumber: string
    status: string
    trackingNumber?: string
  }): Promise<string> {
    return this.sendEmail({
      to: orderData.customerEmail,
      toName: orderData.customerName,
      templateKey: "order_status_update",
      variables: {
        customer_name: orderData.customerName,
        order_number: orderData.orderNumber,
        order_status: orderData.status,
        tracking_number: orderData.trackingNumber || "",
        update_date: new Date().toLocaleDateString(),
      },
    })
  }

  async sendQuoteSubmission(quoteData: {
    customerEmail: string
    customerName: string
    quoteNumber: string
    description: string
  }): Promise<string> {
    return this.sendEmail({
      to: quoteData.customerEmail,
      toName: quoteData.customerName,
      templateKey: "quote_submission",
      variables: {
        customer_name: quoteData.customerName,
        quote_number: quoteData.quoteNumber,
        quote_description: quoteData.description,
        submission_date: new Date().toLocaleDateString(),
      },
    })
  }

  async sendQuoteUpdate(quoteData: {
    customerEmail: string
    customerName: string
    quoteNumber: string
    status: string
    price?: string
  }): Promise<string> {
    return this.sendEmail({
      to: quoteData.customerEmail,
      toName: quoteData.customerName,
      templateKey: 'quote_update',
      variables: {
        customer_name: quoteData.customerName,
        quote_number: quoteData.quoteNumber,
        quote_status: quoteData.status,
        quote_price: quoteData.price || "",
        update_date: new Date().toLocaleDateString(),
      },
    })
  }

  async sendPasswordResetEmail(data: {
    email: string;
    userName: string;
    resetUrl: string;
    expiresAt: string;
  }): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.email_enabled) {
        console.error('Email service is not enabled');
        return false;
      }

      const template = await this.getTemplate('password_reset');
      if (!template) {
        console.error('Password reset template not found');
        return false;
      }

      const variables = {
        user_name: data.userName,
        email: data.email,
        reset_url: data.resetUrl,
        expires_at: data.expiresAt
      };

      const subject = this.replaceVariables(template.subject_template, variables);
      const htmlContent = this.replaceVariables(template.html_template, variables);
      const textContent = template.text_template ? 
        this.replaceVariables(template.text_template, variables) : '';

      const messageId = await this.sendWithResend(settings, {
        to: data.email,
        subject,
        html: htmlContent,
        text: textContent
      });

      await this.logEmail({
        template_key: 'password_reset',
        recipient_email: data.email,
        recipient_name: data.userName,
        subject,
        status: 'sent',
        message_id: messageId
      });

      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // Log the failed attempt
      try {
        await this.logEmail({
          template_key: 'password_reset',
          recipient_email: data.email,
          recipient_name: data.userName,
          subject: 'Password Reset Email',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
      
      return false;
    }
  }
}

// Export convenience function for backward compatibility
export const sendOrderConfirmationEmail = (orderData: {
  customerEmail: string
  customerName: string
  orderNumber: string
  orderTotal: string
  orderItems: Array<{
    name: string
    quantity: number
    price: string
  }>
}) => {
  return emailService.sendOrderConfirmation(orderData)
}

// Export the EmailService class
export { EmailService }

// Export the singleton instance
export const emailService = EmailService.getInstance()
