import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || ""
    const provider = searchParams.get("provider") || ""
    const search = searchParams.get("search") || ""

    // Build query
    let query = supabaseServer.from("payment_transactions").select("*")

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

    // Order by created_at
    query = query.order("created_at", { ascending: false })

    // Execute query
    const { data: transactions, error } = await query

    if (error) {
      console.error("Error fetching transactions for export:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Convert to CSV
    const headers = [
      "Transaction ID",
      "External Transaction ID",
      "Order ID",
      "Provider",
      "Amount",
      "Currency",
      "Status",
      "Payment Method",
      "Error Message",
      "Created At",
      "Updated At",
    ]

    const rows = transactions.map((t) => [
      t.transaction_id,
      t.external_transaction_id || "",
      t.order_id,
      t.provider_name,
      t.amount,
      t.currency || "USD",
      t.status,
      t.payment_method || "",
      t.error_message || "",
      new Date(t.created_at).toISOString(),
      new Date(t.updated_at).toISOString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payment-transactions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error in transactions export API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
