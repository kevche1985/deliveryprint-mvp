import { createClient } from "@supabase/supabase-js"

// Use server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Serverless-compatible email service (NO SMTP/nodemailer)
export class EmailServerService {
  async getSettings() {
    try {
      const { data, error } = await supabaseAdmin.from("email_settings").select("setting_key, setting_value")

      if (error) {
        throw new Error(`Failed to load email settings: ${error.message}`)
      }

      const settingsMap = data.reduce(
        (acc, setting) => {
          acc[setting.setting_key] = setting.setting_value
          return acc
        },
        {} as Record<string, string>,
      )

      return {
        from_email: settingsMap.from_email || "deliveryondemand@groupdeliveryprint.com",
        from_name: settingsMap.from_name || "DeliveryPrint",
        reply_to_email: settingsMap.reply_to_email || "deliveryondemand@groupdeliveryprint.com",
        email_enabled: settingsMap.email_enabled === "true",
        provider: settingsMap.provider || "resend", // Default to Resend
        api_key: settingsMap.api_key || "", // Required for API providers
        // Remove all SMTP settings - not supported in Vercel
      }
    } catch (error) {
      console.error("Error getting email settings:", error)
      throw error
    }
  }

  async ensureTestTemplate() {
    try {
      console.log("Checking for test template...")

      const { data: existingTemplate, error: selectError } = await supabaseAdmin
        .from("email_templates")
        .select("id")
        .eq("template_key", "test_email")
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Error checking for existing template:", selectError)
        throw new Error(`Failed to check for existing template: ${selectError.message}`)
      }

      if (!existingTemplate) {
        console.log("Creating test email template...")

        const { data: newTemplate, error: insertError } = await supabaseAdmin
          .from("email_templates")
          .insert([
            {
              template_key: "test_email",
              template_name: "Test Email",
              subject_template: "✅ DeliveryPrint Email Test - {{timestamp}}",
              html_template: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Test Successful</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
        .message-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .info-item { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #dc2626; }
        .info-label { font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { color: #111827; font-size: 14px; margin-top: 4px; }
        .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 DeliveryPrint</h1>
            <p>Email System Verification</p>
        </div>
        <div class="content">
            <div class="success-badge">✅ Test Successful</div>
            <h2 style="margin: 0 0 15px 0; color: #111827;">Email Configuration Verified!</h2>
            
            <div class="message-box">
                <strong>{{test_message}}</strong>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Sent At</div>
                    <div class="info-value">{{timestamp}}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Template</div>
                    <div class="info-value">{{template_key}}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Provider</div>
                    <div class="info-value">{{provider}}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">✅ Operational</div>
                </div>
            </div>

            <p>Your email system is now properly configured and ready to send notifications to customers!</p>
            
            <a href="{{admin_url}}" class="cta-button">Return to Admin Panel</a>
        </div>
        <div class="footer">
            <p><strong>DeliveryPrint</strong> - Print on Demand Platform</p>
            <p>© 2024 All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
              text_template: `🚀 DELIVERYPRINT EMAIL TEST

✅ EMAIL SYSTEM VERIFICATION SUCCESSFUL!

Test Message: {{test_message}}

System Details:
- Sent At: {{timestamp}}
- Template: {{template_key}}
- Provider: {{provider}}
- Status: ✅ Operational

Your email system is now properly configured and ready to send notifications!

Admin Panel: {{admin_url}}

---
DeliveryPrint - Print on Demand Platform
© 2024 All rights reserved.`,
              variables: ["test_message", "timestamp", "template_key", "provider", "admin_url"],
              is_active: true,
            },
          ])
          .select()

        if (insertError) {
          console.error("Error creating test template:", insertError)
          throw new Error(`Failed to create test template: ${insertError.message}`)
        }

        console.log("Test email template created successfully")
      }
    } catch (error) {
      console.error("Error ensuring test template:", error)
      throw error
    }
  }

  async validateSettings(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const settings = await this.getSettings()
      const errors: string[] = []

      if (!settings.from_email || !settings.from_email.includes("@")) {
        errors.push("Valid from email address is required")
      }

      if (!settings.provider) {
        errors.push("Email provider must be selected")
      }

      if (settings.provider === "resend" || settings.provider === "sendgrid") {
        if (!settings.api_key) {
          errors.push(`API key is required for ${settings.provider}`)
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Settings validation failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const settings = await this.getSettings()

      console.log(`Testing connection with provider: ${settings.provider}`)

      switch (settings.provider) {
        case "resend":
          return await this.testResendConnection(settings)
        case "sendgrid":
          return await this.testSendGridConnection(settings)
        default:
          throw new Error(
            `Unsupported provider: ${settings.provider}. Use 'resend' or 'sendgrid' for Vercel deployment.`,
          )
      }
    } catch (error) {
      console.error("Email connection test failed:", error)
      return false
    }
  }

  private async testResendConnection(settings: any): Promise<boolean> {
    try {
      if (!settings.api_key) {
        throw new Error("Resend API key is required")
      }

      console.log("Testing Resend API connection...")

      const response = await fetch("https://api.resend.com/domains", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
      })

      const success = response.ok
      console.log(`Resend connection test: ${success ? "SUCCESS" : "FAILED"} (${response.status})`)

      if (!success) {
        const errorText = await response.text()
        console.error("Resend API error:", errorText)
      }

      return success
    } catch (error) {
      console.error("Resend connection test failed:", error)
      return false
    }
  }

  private async testSendGridConnection(settings: any): Promise<boolean> {
    try {
      if (!settings.api_key) {
        throw new Error("SendGrid API key is required")
      }

      console.log("Testing SendGrid API connection...")

      const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
      })

      const success = response.ok
      console.log(`SendGrid connection test: ${success ? "SUCCESS" : "FAILED"} (${response.status})`)

      if (!success) {
        const errorText = await response.text()
        console.error("SendGrid API error:", errorText)
      }

      return success
    } catch (error) {
      console.error("SendGrid connection test failed:", error)
      return false
    }
  }

  async sendEmail(emailData: {
    template_key: string
    recipient_email: string
    recipient_name?: string
    template_data: Record<string, any>
  }): Promise<boolean> {
    try {
      const settings = await this.getSettings()

      if (!settings.email_enabled) {
        console.log("Email notifications are disabled")
        return false
      }

      // Ensure test template exists
      if (emailData.template_key === "test_email") {
        await this.ensureTestTemplate()
      }

      // Get template from database
      const { data: template, error } = await supabaseAdmin
        .from("email_templates")
        .select("*")
        .eq("template_key", emailData.template_key)
        .eq("is_active", true)
        .single()

      if (error || !template) {
        throw new Error(`Template not found: ${emailData.template_key}`)
      }

      // Add system info to template data
      const templateData = {
        ...emailData.template_data,
        provider: settings.provider,
        template_key: emailData.template_key,
      }

      // Render template
      const subject = this.renderTemplate(template.subject_template, templateData)
      const html = this.renderTemplate(template.html_template, templateData)
      const text = template.text_template ? this.renderTemplate(template.text_template, templateData) : undefined

      const emailPayload = {
        from: `${settings.from_name} <${settings.from_email}>`,
        to: emailData.recipient_email,
        subject,
        html,
        text,
        replyTo: settings.reply_to_email,
      }

      let result: any
      let messageId: string

      switch (settings.provider) {
        case "resend":
          result = await this.sendWithResend(settings, emailPayload)
          messageId = result.id || "resend-" + Date.now()
          break
        case "sendgrid":
          result = await this.sendWithSendGrid(settings, emailPayload)
          messageId = result.messageId || "sendgrid-" + Date.now()
          break
        default:
          throw new Error(`Unsupported provider: ${settings.provider}`)
      }

      // Log successful email
      await supabaseAdmin.from("email_logs").insert([
        {
          template_key: emailData.template_key,
          recipient_email: emailData.recipient_email,
          recipient_name: emailData.recipient_name,
          subject,
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            message_id: messageId,
            template_data: templateData,
            provider: settings.provider,
          },
        },
      ])

      console.log(`Email sent successfully via ${settings.provider}: ${messageId}`)
      return true
    } catch (error) {
      console.error("Email send error:", error)

      // Log failed email
      await supabaseAdmin.from("email_logs").insert([
        {
          template_key: emailData.template_key,
          recipient_email: emailData.recipient_email,
          recipient_name: emailData.recipient_name,
          subject: "Failed to render subject",
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          metadata: {
            template_data: emailData.template_data,
          },
        },
      ])

      return false
    }
  }

  private async sendWithResend(settings: any, emailPayload: any): Promise<any> {
    console.log("Sending email via Resend...")

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailPayload.from,
        to: [emailPayload.to],
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        reply_to: emailPayload.replyTo,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${error}`)
    }

    return await response.json()
  }

  private async sendWithSendGrid(settings: any, emailPayload: any): Promise<any> {
    console.log("Sending email via SendGrid...")

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: emailPayload.to }],
          },
        ],
        from: { email: emailPayload.from },
        subject: emailPayload.subject,
        content: [
          {
            type: "text/html",
            value: emailPayload.html,
          },
          ...(emailPayload.text
            ? [
                {
                  type: "text/plain",
                  value: emailPayload.text,
                },
              ]
            : []),
        ],
        reply_to: { email: emailPayload.replyTo },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${response.status} - ${error}`)
    }

    return {
      messageId: response.headers.get("x-message-id") || "sendgrid-" + Date.now(),
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template

    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      rendered = rendered.replace(regex, String(data[key] || ""))
    })

    return rendered
  }
}

export const emailServerService = new EmailServerService()
