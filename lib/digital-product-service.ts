import { createClient } from "@supabase/supabase-js"

export type DigitalProductType = "logo" | "image" | "font"

// Define a more specific type for metadata if possible, or keep as Record<string, any>
export interface DigitalProductMetadata extends Record<string, any> {
  order_id?: string
  purchased_at?: string
  transaction_id?: string
  formats?: string[]
  file_size?: number
  content_type?: string
  // Add other known metadata fields
}

export interface DigitalProduct {
  id?: string
  user_id: string
  type: DigitalProductType
  name: string
  description?: string
  preview_url?: string
  download_url?: string
  base_price: number
  generation_inputs?: Record<string, any>
  generated_content?: Record<string, any>
  metadata?: DigitalProductMetadata // Use the more specific type
  status?: string // e.g., "unpurchased", "purchased", "archived"
  created_at?: string
  updated_at?: string
}

/**
 * Create a Supabase client with service role for server operations
 */
function getSupabaseServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase URL or Service Role Key is not defined.")
    throw new Error("Supabase configuration error.")
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create a regular Supabase client for user operations
 */
function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Supabase URL or Anon Key is not defined.")
    throw new Error("Supabase configuration error.")
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

/**
 * Generates a simple UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Stores an AI-generated image in Supabase storage and records it in the database
 */
export async function storeDigitalProduct(
  userId: string,
  productType: DigitalProductType,
  name: string,
  imageUrl: string, // This is the temporary URL of the generated image
  description?: string,
  generationParams?: Record<string, any>,
): Promise<DigitalProduct | null> {
  try {
    console.log(`[Service] Storing digital product: ${productType} - ${name} for user: ${userId}`)

    const supabaseService = getSupabaseServiceClient()

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageUrl}, status: ${imageResponse.status}`)
    }

    const imageBlob = await imageResponse.blob()
    const fileExtension = getFileExtension(imageUrl) || "png" // Ensure getFileExtension handles data URLs if imageUrl can be one
    const fileName = `${generateUUID()}.${fileExtension}`
    const filePath = `${userId}/${productType}/${fileName}`

    console.log(`[Service] Uploading file to path: ${filePath}`)

    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from("digital-products") // Ensure this bucket exists and has correct policies
      .upload(filePath, imageBlob, {
        contentType: imageBlob.type || `image/${fileExtension}`, // Be more specific with contentType
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[Service] Error uploading file to storage:", uploadError)
      throw uploadError
    }

    console.log("[Service] File uploaded successfully:", uploadData.path)

    const { data: publicUrlData } = supabaseService.storage.from("digital-products").getPublicUrl(uploadData.path)
    const finalFileUrl = publicUrlData.publicUrl

    console.log("[Service] Generated public URL:", finalFileUrl)

    const productToInsert: Omit<DigitalProduct, "id" | "created_at" | "updated_at"> & { created_at: string } = {
      user_id: userId,
      type: productType,
      name,
      description: description || `AI-generated ${productType}`,
      preview_url: finalFileUrl,
      download_url: finalFileUrl, // Initially, download and preview might be the same
      base_price: productType === "logo" ? 9.99 : productType === "font" ? 14.99 : 4.99,
      generation_inputs: generationParams || {},
      generated_content: {
        original_temp_url: imageUrl, // Store the temp URL for reference if needed
        stored_url: finalFileUrl,
        file_extension: fileExtension,
      },
      metadata: {
        formats: [fileExtension], // Initial format
        file_size: imageBlob.size,
        content_type: imageBlob.type || `image/${fileExtension}`,
      },
      status: "unpurchased",
      created_at: new Date().toISOString(), // Add created_at for insert
    }

    const { data: productData, error: productError } = await supabaseService
      .from("digital_products")
      .insert(productToInsert)
      .select()
      .single()

    if (productError) {
      console.error("[Service] Error inserting digital product record:", productError)
      throw productError
    }

    console.log("[Service] Digital product stored successfully:", productData.id)
    return productData as DigitalProduct
  } catch (error: any) {
    console.error("[Service] Error in storeDigitalProduct:", error.message)
    // Consider if this function should throw or return null for the API to handle
    return null
  }
}

/**
 * Retrieves a digital product by ID
 */
export async function getDigitalProductById(id: string): Promise<DigitalProduct | null> {
  try {
    const supabase = getSupabaseClient() // Use regular client if RLS allows user to fetch their own
    const { data, error } = await supabase.from("digital_products").select("*").eq("id", id).single()

    if (error) {
      console.error(`[Service] Error fetching digital product ${id}:`, error)
      return null
    }
    return data as DigitalProduct
  } catch (error: any) {
    console.error(`[Service] Unexpected error in getDigitalProductById for ${id}:`, error.message)
    return null
  }
}

/**
 * Updates a digital product's purchase status and related metadata.
 */
export async function markDigitalProductAsPurchased(
  productId: string,
  orderId: string,
  transactionId?: string,
): Promise<DigitalProduct | null> {
  console.log(
    `[Service] Attempting to mark product ${productId} as purchased for order ${orderId}. Tx: ${transactionId || "N/A"}`,
  )
  try {
    const supabaseService = getSupabaseServiceClient()

    const { data: existingProduct, error: fetchError } = await supabaseService
      .from("digital_products")
      .select("metadata, status")
      .eq("id", productId)
      .single()

    if (fetchError) {
      console.error(`[Service] Error fetching product ${productId} for purchase update:`, fetchError.message)
      return null
    }
    if (!existingProduct) {
      console.warn(`[Service] Product ${productId} not found. Cannot mark as purchased.`)
      return null
    }

    if (existingProduct.status === "purchased" && existingProduct.metadata?.order_id === orderId) {
      console.warn(
        `[Service] Product ${productId} already marked purchased for order ${orderId}. Re-fetching full data.`,
      )
      // Fetch and return the full product data if already correctly processed
      const { data: fullProductData, error: fullFetchError } = await supabaseService
        .from("digital_products")
        .select("*")
        .eq("id", productId)
        .single()
      if (fullFetchError) {
        console.error(`[Service] Error re-fetching already purchased product ${productId}:`, fullFetchError.message)
        return null
      }
      return fullProductData as DigitalProduct | null
    }

    // Only proceed if status is 'unpurchased' or if it's a different order_id (though latter is less likely for this function's intent)
    if (existingProduct.status !== "unpurchased") {
      console.warn(
        `[Service] Product ${productId} status is '${existingProduct.status}', not 'unpurchased'. Order ${orderId}. No update performed by markDigitalProductAsPurchased.`,
      )
      // Optionally, fetch and return the current full product data
      const { data: currentFullProduct, error: currentFetchError } = await supabaseService
        .from("digital_products")
        .select("*")
        .eq("id", productId)
        .single()
      if (currentFetchError) {
        console.error(`[Service] Error fetching current state of product ${productId}:`, currentFetchError.message)
        return null
      }
      return currentFullProduct as DigitalProduct | null
    }

    const updatedMetadata: DigitalProductMetadata = {
      ...(existingProduct.metadata || {}), // Preserve existing metadata
      order_id: orderId,
      purchased_at: new Date().toISOString(),
    }
    if (transactionId) {
      updatedMetadata.transaction_id = transactionId
    }

    const { data: updatedProduct, error: updateError } = await supabaseService
      .from("digital_products")
      .update({
        status: "purchased",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("status", "unpurchased") // Ensure atomicity: only update if still unpurchased
      .select()
      .single()

    if (updateError) {
      console.error(`[Service] Error updating product ${productId} to purchased:`, updateError.message)
      return null
    }
    if (!updatedProduct) {
      console.warn(
        `[Service] Product ${productId} was not updated. It might have been updated by another process or status was not 'unpurchased'.`,
      )
      // Fetch current state to return
      const { data: currentProductState, error: fetchCurrentError } = await supabaseService
        .from("digital_products")
        .select("*")
        .eq("id", productId)
        .single()
      if (fetchCurrentError) return null
      return currentProductState as DigitalProduct | null
    }

    console.log(`[Service] Product ${productId} successfully marked as purchased. Metadata:`, updatedProduct.metadata)
    return updatedProduct as DigitalProduct
  } catch (error: any) {
    console.error(`[Service] Unexpected error in markDigitalProductAsPurchased for ${productId}:`, error.message)
    return null
  }
}

// ... (getUserDigitalProducts, getUserPurchasedDigitalProducts, getUserUnpurchasedDigitalProducts remain the same)

/**
 * Helper function to extract file extension from URL or data URL
 */
function getFileExtension(source: string): string | null {
  if (source.startsWith("data:")) {
    const match = source.match(/^data:image\/([a-zA-Z0-9]+);base64,/)
    return match ? match[1].toLowerCase() : null // e.g., 'png' from 'data:image/png;base64,...'
  }
  try {
    const url = new URL(source)
    const pathname = url.pathname
    const lastDot = pathname.lastIndexOf(".")
    if (lastDot === -1 || lastDot === pathname.length - 1) {
      return null // No extension or ends with a dot
    }
    return pathname.substring(lastDot + 1).toLowerCase()
  } catch (e) {
    // Not a valid URL, try simple regex for filename-like strings
    const match = source.match(/\.([a-zA-Z0-9]+)$/)
    return match ? match[1].toLowerCase() : null
  }
}

// Keep existing functions like getUserDigitalProducts, etc.
export async function getUserDigitalProducts(userId: string): Promise<DigitalProduct[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("digital_products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user digital products:", error)
      return []
    }

    return (data || []) as DigitalProduct[]
  } catch (error) {
    console.error("Error retrieving user digital products:", error)
    return []
  }
}

export async function getUserPurchasedDigitalProducts(userId: string): Promise<DigitalProduct[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("digital_products")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "purchased")
      .order("created_at", { ascending: false }) // Or updated_at for purchase time

    if (error) {
      console.error("Error fetching user purchased digital products:", error)
      return []
    }

    return (data || []) as DigitalProduct[]
  } catch (error) {
    console.error("Error retrieving user purchased digital products:", error)
    return []
  }
}

export async function getUserUnpurchasedDigitalProducts(userId: string): Promise<DigitalProduct[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("digital_products")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "unpurchased")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user unpurchased digital products:", error)
      return []
    }

    return (data || []) as DigitalProduct[]
  } catch (error) {
    console.error("Error retrieving user unpurchased digital products:", error)
    return []
  }
}
