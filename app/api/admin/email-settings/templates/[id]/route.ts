import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: template, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      throw error
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error("Error fetching email template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch email template",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { template_name, subject_template, html_template, text_template, variables, is_active } = body

    // Validate required fields
    if (!template_name || !subject_template || !html_template) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: template_name, subject_template, html_template" },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from("email_templates")
      .update({
        template_name,
        subject_template,
        html_template,
        text_template: text_template || '',
        variables: variables || [],
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      template,
      message: "Email template updated successfully"
    })
  } catch (error) {
    console.error("Error updating email template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update email template",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if template exists and get its key for validation
    const { data: existingTemplate } = await supabase
      .from("email_templates")
      .select("template_key")
      .eq("id", params.id)
      .single()

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      )
    }

    // Prevent deletion of system templates
    const systemTemplates = ['test_email', 'order_confirmation', 'quote_request', 'quote_response']
    if (systemTemplates.includes(existingTemplate.template_key)) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system templates" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Email template deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting email template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete email template",
      },
      { status: 500 },
    )
  }
}