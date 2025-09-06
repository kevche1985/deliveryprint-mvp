import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { stringify } from "csv-stringify/sync"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    let query = supabase.from("products").select("*").order("created_at", { ascending: false })

    if (idsParam) {
      const productIds = idsParam.split(",")
      query = query.in("id", productIds)
    }

    const { data: products, error } = await query

    if (error) {
      console.error("Error fetching products for export:", error)
      return NextResponse.json({ error: "Failed to fetch products for export." }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No products found to export." }, { status: 404 })
    }

    // Define columns for CSV, ensuring all relevant fields are included
    const columns = [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
      { key: "price", header: "Price" },
      { key: "category", header: "Category" },
      { key: "image", header: "Image URL" },
      { key: "is_active", header: "Is Active" },
      { key: "is_featured", header: "Is Featured" },
      { key: "created_at", header: "Created At" },
      { key: "updated_at", header: "Updated At" },
    ]

    const csvString = stringify(products, {
      header: true,
      columns: columns,
    })

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="products_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("API Error during product export:", error)
    return NextResponse.json({ error: error.message || "Internal server error during export." }, { status: 500 })
  }
}
