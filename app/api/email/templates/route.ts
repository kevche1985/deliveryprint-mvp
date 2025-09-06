import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }
    
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in GET /api/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        template_key: body.template_key,
        template_name: body.template_name,
        subject_template: body.subject_template,
        html_template: body.html_template,
        text_template: body.text_template,
        variables: body.variables || [],
        is_active: body.is_active ?? true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }
    
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error in POST /api/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        template_key: body.template_key,
        template_name: body.template_name,
        subject_template: body.subject_template,
        html_template: body.html_template,
        text_template: body.text_template,
        variables: body.variables || [],
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }
    
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error in PUT /api/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/email/templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}