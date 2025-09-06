import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const serviceType = searchParams.get("service_type")
    const urgency = searchParams.get("urgency")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase
      .from("quotes")
      .select(
        `
        *,
        quote_files(count),
        quote_status_history(count),
        customer_profile:user_profiles!quotes_customer_id_fkey(
          first_name,
          last_name,
          avatar_url
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }
    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }
    if (urgency) {
      query = query.eq("urgency_level", urgency)
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,quote_number.ilike.%${search}%,customer_company.ilike.%${search}%`,
      )
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching quotes:", error)
      return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
    }

    return NextResponse.json({
      quotes: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Admin quotes API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export const dynamic = 'force-dynamic'
