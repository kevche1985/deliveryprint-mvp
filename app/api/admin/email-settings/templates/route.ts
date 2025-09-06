import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabase.from("email_templates").select("*").order("template_name")

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    })
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch email templates",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template_key, template_name, subject_template, html_template, text_template, variables, is_active } = body

    // Validate required fields
    if (!template_key || !template_name || !subject_template || !html_template) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: template_key, template_name, subject_template, html_template" },
        { status: 400 }
      )
    }

    // Check if template_key already exists
    const { data: existingTemplate } = await supabase
      .from("email_templates")
      .select("id")
      .eq("template_key", template_key)
      .single()

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template key already exists" },
        { status: 409 }
      )
    }

    const { data: template, error } = await supabase
      .from("email_templates")
      .insert({
        template_key,
        template_name,
        subject_template,
        html_template,
        text_template: text_template || '',
        variables: variables || [],
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      template,
      message: "Email template created successfully"
    })
  } catch (error) {
    console.error("Error creating email template:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create email template",
      },
      { status: 500 },
    )
  }
}
