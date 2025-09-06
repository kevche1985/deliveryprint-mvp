import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Increase size limits to 10MB
const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB total request

export async function POST(request: NextRequest) {
  console.log("🎨 Creating digital product from memory...")

  try {
    // Check content length first
    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > MAX_REQUEST_SIZE) {
      console.log(`❌ Request too large: ${contentLength} bytes (max: ${MAX_REQUEST_SIZE})`)
      return NextResponse.json(
        {
          success: false,
          error: `Request too large. Maximum size is ${Math.round(MAX_REQUEST_SIZE / 1024 / 1024)}MB`,
        },
        { status: 413 },
      )
    }

    // Read request body with increased size limit
    let requestText: string
    try {
      requestText = await request.text()
      if (requestText.length > MAX_REQUEST_SIZE) {
        throw new Error(`Request body too large: ${requestText.length} bytes`)
      }
    } catch (error) {
      console.error("❌ Failed to read request body:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read request body. Request may be too large.",
        },
        { status: 400 },
      )
    }

    console.log(`📏 Request body size: ${Math.round((requestText.length / 1024 / 1024) * 100) / 100}MB`)

    // Parse JSON safely
    let requestData: any
    try {
      requestData = JSON.parse(requestText)
    } catch (jsonError) {
      console.error("❌ JSON parse error:", jsonError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!requestData.name || !requestData.type) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name and type",
        },
        { status: 400 },
      )
    }

    // Get auth token
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization header required",
        },
        { status: 401 },
      )
    }

    // Create Supabase client for auth
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Get user from token
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.log("❌ Authentication failed:", authError?.message)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    console.log("✅ User authenticated:", user.id)

    // Create service role client for storage and database operations
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // Upload only the image to Supabase Storage (no design data file)
    let imageUrl = null

    if (requestData.file_data?.canvas_data) {
      try {
        console.log("📁 Uploading image to Supabase Storage...")

        // Convert base64 to buffer (no compression)
        const base64Data = requestData.file_data.canvas_data.split(",")[1]
        const imageBuffer = Buffer.from(base64Data, "base64")

        console.log(`📏 Image buffer size: ${Math.round((imageBuffer.length / 1024 / 1024) * 100) / 100}MB`)

        // Use the custom design name for the file path instead of the ID
        const imageFileName = `designs/${user.id}/${requestData.name}_${Date.now()}.png`

        const { data: imageUploadData, error: imageUploadError } = await supabaseService.storage
          .from("digital-products")
          .upload(imageFileName, imageBuffer, {
            contentType: "image/png",
            upsert: true,
          })

        if (imageUploadError) {
          console.error("❌ Image upload error:", imageUploadError)
          return NextResponse.json(
            {
              success: false,
              error: `Failed to upload image: ${imageUploadError.message}`,
            },
            { status: 500 },
          )
        }

        // Get public URL for the image
        const { data: imageUrlData } = supabaseService.storage.from("digital-products").getPublicUrl(imageFileName)
        imageUrl = imageUrlData.publicUrl

        console.log("✅ Image uploaded successfully:", imageUrl)
      } catch (storageError) {
        console.error("❌ Storage error:", storageError)
        return NextResponse.json(
          {
            success: false,
            error: `Storage upload failed: ${storageError}`,
          },
          { status: 500 },
        )
      }
    }

    // Prepare minimal database record (let database auto-generate UUID)
    const dbRecord = {
      // Remove the id field - let database auto-generate UUID
      user_id: user.id,
      type: requestData.type,
      name: requestData.name.substring(0, 255), // Use the custom design name
      description: requestData.description?.substring(0, 1000) || null,
      base_price: requestData.base_price || 0,
      status: "unpurchased",
      preview_url: imageUrl,
      download_url: imageUrl,
      // Store only essential metadata (no large data)
      generation_inputs: {
        base_product: requestData.generation_inputs?.base_product,
        base_product_id: requestData.generation_inputs?.base_product_id,
        elements_count: requestData.generation_inputs?.elements_count,
        user_email: requestData.generation_inputs?.user_email,
        generated_name: requestData.generation_inputs?.generated_name,
        custom_design_id: requestData.id, // Store the custom ID as metadata
      },
      generated_content: {
        formats: ["png", "pdf", "svg", "jpg"],
        image_url: imageUrl,
        storage_path: `designs/${user.id}/${requestData.name}`,
        file_extension: "png",
        has_image: true,
        custom_design_id: requestData.id, // Store the custom ID here too
      },
      metadata: {
        created_via: "design_editor",
        image_stored: true,
        original_request_size: requestText.length,
        storage_url: imageUrl,
        custom_design_id: requestData.id, // And here for reference
      },
    }

    console.log("💾 Inserting digital product record (auto-generating UUID)...")

    // Insert into database with minimal data (auto-generate UUID)
    let insertResult
    try {
      const { data, error } = await supabaseService.from("digital_products").insert([dbRecord]).select().single()

      if (error) {
        console.error("❌ Database insert error:", error)

        // Clean up uploaded files if database insert failed
        if (imageUrl) {
          try {
            const imageFileName = `designs/${user.id}/${requestData.name}_${Date.now()}.png`
            await supabaseService.storage.from("digital-products").remove([imageFileName])
            console.log("🧹 Cleaned up uploaded files after database error")
          } catch (cleanupError) {
            console.error("⚠️ Failed to cleanup uploaded files:", cleanupError)
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: `Failed to create digital product: ${error.message}`,
            details: error,
          },
          { status: 500 },
        )
      }

      insertResult = data
      console.log("✅ Digital product created successfully with UUID:", insertResult.id)
    } catch (dbError: any) {
      console.error("❌ Database operation failed:", dbError)

      // Clean up uploaded files
      if (imageUrl) {
        try {
          const imageFileName = `designs/${user.id}/${requestData.name}_${Date.now()}.png`
          await supabaseService.storage.from("digital-products").remove([imageFileName])
        } catch (cleanupError) {
          console.error("❌ Failed to cleanup uploaded files:", cleanupError)
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: `Failed to create digital product: ${dbError.message || "Unknown database error"}`,
          details: dbError,
        },
        { status: 500 },
      )
    }

    // Return success response with the auto-generated UUID
    return NextResponse.json({
      success: true,
      product: {
        id: insertResult.id, // This is now the auto-generated UUID
        name: insertResult.name, // This is the custom design name
        preview_url: insertResult.preview_url,
        download_url: insertResult.download_url,
        status: insertResult.status,
        created_at: insertResult.created_at,
        storage_url: imageUrl,
        custom_design_id: requestData.id, // Return the original custom ID for reference
      },
      message: "Digital product created successfully with image stored in Supabase Storage",
    })
  } catch (error: any) {
    console.error("💥 Unexpected error in create-memory:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
