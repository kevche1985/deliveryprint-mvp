import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quoteId = params.id
    const formData = await request.formData()

    // Verify quote exists
    const { data: quote, error: quoteError } = await supabase.from("quotes").select("id").eq("id", quoteId).single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    const uploadedFiles = []

    // Process each file
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-") && value instanceof File) {
        try {
          const file = value
          const fileExt = file.name.split(".").pop()
          const fileName = `${quoteId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

          // Upload file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("quote-files")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("File upload error:", uploadError)
            continue
          }

          // Save file record to database
          const { data: fileRecord, error: fileError } = await supabase
            .from("quote_files")
            .insert({
              quote_id: quoteId,
              original_filename: file.name,
              stored_filename: fileName,
              file_path: uploadData.path,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: "customer",
            })
            .select()
            .single()

          if (fileError) {
            console.error("File record error:", fileError)
            // Clean up uploaded file
            await supabase.storage.from("quote-files").remove([fileName])
            continue
          }

          uploadedFiles.push(fileRecord)
        } catch (error) {
          console.error("Individual file processing error:", error)
          continue
        }
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`,
    })
  } catch (error) {
    console.error("File upload API error:", error)
    return NextResponse.json(
      {
        error: "File upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
