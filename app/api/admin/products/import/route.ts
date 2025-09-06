import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { parse } from "csv-parse/sync"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const csvString = buffer.toString("utf-8")

    const records = parse(csvString, {
      columns: true, // Treat the first row as column headers
      skip_empty_lines: true,
      trim: true,
    })

    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (const record of records) {
      try {
        const { id, name, description, price, category, image, is_active, is_featured } = record

        if (!name || !price) {
          errors.push(`Skipping row due to missing name or price: ${JSON.stringify(record)}`)
          continue
        }

        const productData = {
          name: String(name),
          description: description ? String(description) : null,
          price: Number.parseFloat(price),
          category: category ? String(category) : null,
          image: image ? String(image) : null,
          is_active: String(is_active).toLowerCase() === "true" || String(is_active) === "1",
          is_featured: String(is_featured).toLowerCase() === "true" || String(is_featured) === "1",
        }

        if (isNaN(productData.price)) {
          errors.push(`Skipping row due to invalid price: ${JSON.stringify(record)}`)
          continue
        }

        if (id) {
          // Attempt to update existing product
          const { data, error } = await supabase.from("products").update(productData).eq("id", id).select().single()

          if (error) {
            if (error.code === "PGRST116") {
              // No rows found for update
              // If ID exists but no row found, it might be a new product with an ID, or an invalid ID.
              // For simplicity, we'll treat it as an insert if no row was updated.
              const { data: insertData, error: insertError } = await supabase
                .from("products")
                .insert([{ ...productData, id: id }]) // Try inserting with provided ID
                .select()
                .single()
              if (insertError) {
                errors.push(
                  `Failed to insert product with ID ${id}: ${insertError.message} - ${JSON.stringify(record)}`,
                )
              } else {
                createdCount++
              }
            } else {
              errors.push(`Failed to update product with ID ${id}: ${error.message} - ${JSON.stringify(record)}`)
            }
          } else {
            updatedCount++
          }
        } else {
          // Insert new product
          const { data, error } = await supabase.from("products").insert([productData]).select().single()
          if (error) {
            errors.push(`Failed to create product: ${error.message} - ${JSON.stringify(record)}`)
          } else {
            createdCount++
          }
        }
      } catch (rowError: any) {
        errors.push(`Error processing row ${JSON.stringify(record)}: ${rowError.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: "Import completed with errors.",
          created: createdCount,
          updated: updatedCount,
          errors: errors,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      message: "Products imported successfully.",
      created: createdCount,
      updated: updatedCount,
    })
  } catch (error: any) {
    console.error("API Error during product import:", error)
    return NextResponse.json({ error: error.message || "Internal server error during import." }, { status: 500 })
  }
}
