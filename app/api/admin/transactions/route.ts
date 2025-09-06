import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const status = searchParams.get("status") || ""
    const provider = searchParams.get("provider") || ""
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabaseServer.from("payment_transactions").select("*", { count: "exact" })

    // Apply filters
    if (status) {
      query = query.ilike("status", `%${status}%`)
    }

    if (provider) {
      query = query.eq("provider_name", provider)
    }

    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,transaction_id.ilike.%${search}%,external_transaction_id.ilike.%${search}%`,
      )
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Apply pagination
    query = query.range(from, to)

    // Execute query
    const { data: transactions, error, count } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({
      transactions,
      total: count || 0,
      page,
      pageSize,
    })
  } catch (error: any) {
    console.error("Error in transactions API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
