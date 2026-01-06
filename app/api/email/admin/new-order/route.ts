import { NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"
import { supabaseServer } from "@/lib/supabase-server"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = supabaseServer
    let order = body.order

    if (!order && body.orderId) {
      const { data, error } = await supabase.from("orders").select("*").eq("id", body.orderId).single()
      if (error) throw new Error(error.message)
      order = data
    }

    if (!order) return NextResponse.json({ success: false, error: "Missing order data" }, { status: 400 })

    const settings = await emailService.getSettings()
    const to = settings.admin_email || ""
    if (!settings.email_enabled || !to) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const variables = {
      order_number: order.order_number,
      customer_email: order.email,
      order_status: order.status,
      order_total: typeof order.total === "number" ? `$${order.total.toFixed(2)}` : String(order.total ?? ""),
      admin_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders`
    }

    try {
      const { data: existing } = await supabase.from("email_templates").select("*").eq("template_key", "new_order_admin_notification").eq("is_active", true).single()
      if (!existing) {
        const subject_template = "Nuevo pedido {{order_number}}"
        const html_template = `
          <h2>Nuevo pedido recibido</h2>
          <p><strong>Pedido:</strong> {{order_number}}</p>
          <p><strong>Cliente:</strong> {{customer_email}}</p>
          <p><strong>Estado:</strong> {{order_status}}</p>
          <p><strong>Total:</strong> {{order_total}}</p>
          <p><a href="{{admin_url}}" style="display:inline-block;padding:10px 16px;background:#8B0000;color:#fff;text-decoration:none;border-radius:6px">Gestionar en Admin</a></p>
        `
        const text_template = "Nuevo pedido {{order_number}} - Cliente: {{customer_email}} - Estado: {{order_status}} - Total: {{order_total}} - Admin: {{admin_url}}"
        await supabase.from("email_templates").insert({
          template_key: "new_order_admin_notification",
          template_name: "Notificación de Nuevo Pedido (Admin)",
          subject_template,
          html_template,
          text_template,
          variables: ["order_number", "customer_email", "order_status", "order_total", "admin_url"],
          is_active: true,
        })
      }
      await emailService.sendEmail({ to, templateKey: "new_order_admin_notification", variables })
      return NextResponse.json({ success: true })
    } catch (e) {
      await emailService.sendEmail({ to, templateKey: "order_confirmation", variables })
      return NextResponse.json({ success: true, fallback: true })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
