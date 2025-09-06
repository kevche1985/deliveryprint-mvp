import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate quote number
    const quoteNumber = `Q${Date.now()}`

    const quoteData = {
      ...body,
      quote_number: quoteNumber,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    // Create quote in database
    const { data: quote, error } = await supabase.from("quotes").insert([quoteData]).select().single()

    if (error) {
      console.error("Error creating quote:", error)
      return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
    }

    // Send quote submission notifications
    try {
      await emailService.sendQuoteSubmittedNotification(quote)
      console.log("Quote submission emails sent for quote:", quote.id)
    } catch (emailError) {
      console.error("Error sending quote notification emails:", emailError)
      // Don't fail the quote creation if email fails
    }

    return NextResponse.json({
      success: true,
      quote,
      message: "Quote submitted successfully. You will receive a confirmation email shortly.",
    })
  } catch (error) {
    console.error("Error in quote submission:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit quote" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: quotes, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching quotes:", error)
      return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error("Error in quotes fetch:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quotes" },
      { status: 500 },
    )
  }
}
