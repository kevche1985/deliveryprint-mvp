import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle different actions
    if (body.action === "create_items") {
      // Create quote items
      const { items } = body

      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: "Invalid items data" }, { status: 400 })
      }

      const { data: quoteItems, error: itemsError } = await supabase.from("quote_items").insert(items).select()

      if (itemsError) {
        console.error("Error creating quote items:", itemsError)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }

      return NextResponse.json({ items: quoteItems })
    }

    // Default: Create quote
    const {
      customer_name,
      customer_email,
      customer_phone,
      quote_number,
      status,
      request_description,
      service_type,
      priority,
      customer_id,
      created_by,
      valid_until,
      currency,
    } = body

    // Validate required fields
    if (!customer_name || !customer_email || !service_type) {
      return NextResponse.json(
        { error: "Missing required fields: customer_name, customer_email, service_type" },
        { status: 400 },
      )
    }

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        customer_name,
        customer_email,
        customer_phone,
        quote_number,
        status: status || "pending",
        request_description,
        service_type,
        priority: priority || "normal",
        customer_id,
        created_by,
        valid_until,
        currency: currency || "USD",
      })
      .select()
      .single()

    if (quoteError) {
      console.error("Error creating quote:", quoteError)
      return NextResponse.json({ error: quoteError.message }, { status: 500 })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("Error in quotes API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customer_id")

    let query = supabase
      .from("quotes")
      .select(`
        *,
        quote_items (
          id,
          description,
          quantity
        )
      `)
      .order("created_at", { ascending: false })

    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error("Error fetching quotes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error("Error in quotes GET API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
