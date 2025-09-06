import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id

    // Get quote with related data
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select(`
        *,
        quote_files(*),
        quote_status_history(
          *,
          changed_by_profile:user_profiles!quote_status_history_changed_by_fkey(
            first_name,
            last_name,
            email
          )
        ),
        quote_communications(*)
      `)
      .eq("id", quoteId)
      .single()

    if (quoteError) {
      console.error("Error fetching quote:", quoteError)
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("Quote fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch quote",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id
    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, created_at, quote_number, ...allowedUpdates } = updates

    const { data: quote, error: updateError } = await supabase
      .from("quotes")
      .update(allowedUpdates)
      .eq("id", quoteId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating quote:", updateError)
      return NextResponse.json({ error: "Failed to update quote" }, { status: 500 })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("Quote update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update quote",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
