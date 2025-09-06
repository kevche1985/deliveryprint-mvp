import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let query = supabase
      .from("digital_downloads")
      .select(`
        *,
        digital_order_items (
          *,
          digital_orders (*),
          digital_products (*)
        )
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching digital downloads:", error)
      return NextResponse.json({ error: "Failed to fetch downloads" }, { status: 500 })
    }

    // Filter by status if provided
    let filteredData = data
    if (status) {
      const now = new Date()
      filteredData = data?.filter((download) => {
        const expiresAt = new Date(download.expires_at)
        if (status === "active") {
          return expiresAt > now
        } else if (status === "expired") {
          return expiresAt <= now
        }
        return true
      })
    }

    return NextResponse.json({ downloads: filteredData })
  } catch (error) {
    console.error("Error in digital downloads API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
