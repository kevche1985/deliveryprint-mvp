import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("payment_transactions")
      .select(`
        *,
        orders (
          order_number,
          email,
          total
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (provider && provider !== "all") {
      query = query.eq("provider_name", provider)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching payment transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({
      transactions: data,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/payments/transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const transaction = await request.json()

    const { data, error } = await supabase
      .from("payment_transactions")
      .insert([
        {
          order_id: transaction.order_id,
          provider_name: transaction.provider_name,
          transaction_id: transaction.transaction_id,
          external_transaction_id: transaction.external_transaction_id,
          amount: transaction.amount,
          currency: transaction.currency || "USD",
          status: transaction.status || "pending",
          payment_method: transaction.payment_method,
          response_data: transaction.response_data,
          error_message: transaction.error_message,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating payment transaction:", error)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in POST /api/admin/payments/transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
