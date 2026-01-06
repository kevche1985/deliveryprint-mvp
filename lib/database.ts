import { supabase } from "@/lib/supabase"

// Product Types
export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  image: string | null // Base product image
  is_active: boolean
  is_featured: boolean
  // New: controls whether product supports customization flows
  is_customizable: boolean
  created_at: string
  updated_at: string | null
  tenant_id: string | null
}

export type ProductImage = {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  display_order?: number
}

export type ProductVariant = {
  id: string
  product_id: string
  name: string
  sku: string | null
  price: number
  attributes: Record<string, any>
  inventory: number
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  is_active: boolean
}

// Design Types
export type DesignStatus = "draft" | "in_cart" | "ordered" | "archived" | "template" | "user_saved"

export type Design = {
  id: string
  name: string
  thumbnail_url: string | null // Preview of the design itself
  user_id: string
  design_data: any // e.g., Fabric.js JSON, or object with URLs to different file types
  is_public: boolean
  is_template: boolean
  created_at: string
  updated_at: string | null
  order_id?: string | null // Link to the order if this design was part of one
  status?: DesignStatus // Status of the design
}

// Order Types
export type Order = {
  id: string
  order_number: string
  user_id: string
  email: string
  status: string // e.g., pending, processing, paid, shipped, completed, cancelled
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  shipping_address: any
  billing_address: any
  payment_method: string
  shipping_method?: string
  notes?: string
  currency?: string
  created_at: string
  updated_at: string | null
  // For digital orders, this might be an array of OrderItem like objects
  // if not using the standard order_items table for digital products.
  // However, it's better to keep structure consistent.
  order_items?: OrderItem[] // Optional: for eager loading
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string // ID of the base physical product (e.g., T-Shirt)
  variant_id: string | null
  design_id: string | null // ID of the associated design in the 'designs' table
  digital_product_id: string | null // ID of the digital product from digital_products table
  name: string // Name of the item, e.g., "Custom T-Shirt - My Awesome Design"
  quantity: number
  price: number // Price for one unit of this customized item
  customizations: any // JSON object detailing the customization (e.g., colors, text, design parameters from Fabric.js)
  product_image_url: string | null // URL of the base product's image
  design_image_url: string | null // URL of the preview image of the final customized product or the design itself
  design_file_url: string | null // URL to the production-ready design file (e.g., for printing)
  customized_image_url: string | null // URL of the customized product image
  print_ready_file_url: string | null // URL of the print-ready file
  created_at?: string
  // Optional relation to products table
  products?: {
    id: string
    name: string
    image: string | null
    category: string | null
  }
}

// User Types
export type User = {
  id: string
  email: string
  name: string | null
  role: string
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export type Supplier = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  contact_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

// Service Types
export type Service = {
  id: string
  name: string
  description: string | null
  category: string | null
  image: string | null
  price: number
  is_active: boolean
  is_featured: boolean
  slug: string | null
  created_at: string
  updated_at?: string | null
}

// Quote Types
export type Quote = {
  id: string
  quote_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: string
  notes: string | null
  customer_id: string | null
  created_by: string | null
  valid_until: string | null
  currency: string
  created_at: string
  updated_at: string
}

// Support Ticket Types
export type SupportTicket = {
  id: string
  ticket_number: string
  customer_name: string
  customer_email: string
  subject: string
  message: string
  status: string
  priority: string
  assigned_to: string | null
  customer_id: string | null
  created_at: string
  updated_at: string
}

// Product Functions
export async function getProducts(
  options: {
    category?: string
    search?: string
    featured?: boolean
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
    tenantId?: string
  } = {},
) {
  let query = supabase.from("products").select("*").eq("is_active", true)

  if (options.tenantId) {
    query = query.eq("tenant_id", options.tenantId)
  }

  if (options.category) {
    query = query.eq("category", options.category)
  }

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  if (options.featured) {
    query = query.eq("is_featured", true)
  }

  if (options.sortBy) {
    query = query.order(options.sortBy, { ascending: options.sortOrder === "asc" })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching products:", error)
    throw error
  }

  // Default legacy/null values to customizable=true for backward compatibility
  return (data ?? []).map((p: any) => ({
    ...p,
    is_customizable: p?.is_customizable ?? true,
  })) as Product[]
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching product:", error)
    // Return null or an error object instead of throwing, to allow for graceful handling
    return null
  }

  if (!data) return null
  return { ...data, is_customizable: (data as any).is_customizable ?? true } as Product
}


export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase.from("products").select("*").eq("name", slug.replace(/-/g, " ")).single()

  if (error) {
    console.error("Error fetching product by slug:", error)
    return null
  }

  if (!data) return null
  return { ...data, is_customizable: (data as any).is_customizable ?? true } as Product
}

export async function getProductImages(productId: string) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching product images:", error)
    return []
  }

  return data as ProductImage[]
}

export async function getProductVariants(productId: string) {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching product variants:", error)
    return []
  }

  return data as ProductVariant[]
}

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").eq("is_active", true)

  if (error) {
    console.error("Error fetching categories:", error)
    throw error
  }

  return data as Category[]
}

// Design Functions
export async function createDesign(design: Omit<Design, "id" | "created_at" | "updated_at">): Promise<Design> {
  const { data, error } = await supabase.from("designs").insert([design]).select().single()

  if (error) {
    console.error("Error creating design:", error)
    throw error
  }

  return data as Design
}

// Services CRUD
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false })
  if (error) {
    console.error("Error fetching services:", error)
    throw error
  }
  return (data || []) as Service[]
}

export async function createService(service: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
  const { data, error } = await supabase.from("services").insert([service]).select().single()
  if (error) {
    console.error("Error creating service:", error)
    throw error
  }
  return data as Service
}

export async function updateService(id: string, service: Partial<Omit<Service, "id" | "created_at" | "updated_at">>): Promise<Service> {
  const { data, error } = await supabase.from("services").update(service).eq("id", id).select().single()
  if (error) {
    console.error("Error updating service:", error)
    throw error
  }
  return data as Service
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) {
    console.error("Error deleting service:", error)
    throw error
  }
}

export async function getUserDesigns(userId: string) {
  const { data, error } = await supabase
    .from("designs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user designs:", error)
    throw error
  }

  return data as Design[]
}

export async function getDesignById(id: string) {
  const { data, error } = await supabase.from("designs").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching design:", error)
    return null // Return null on error for easier checking
  }

  return data as Design
}

export async function updateDesign(id: string, updates: Partial<Design>): Promise<Design | null> {
  const { data, error } = await supabase.from("designs").update(updates).eq("id", id).select().single()

  if (error) {
    console.error(`Error updating design ${id}:`, error)
    return null
  }
  return data as Design
}

// Order Functions
export async function createOrder(order: Omit<Order, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("orders").insert([order]).select().single()

  if (error) {
    console.error("Error creating order:", error)
    throw error
  }

  return data as Order
}

export async function createOrderItems(orderItems: Omit<OrderItem, "id" | "created_at">[]) {
  const { data, error } = await supabase.from("order_items").insert(orderItems).select()

  if (error) {
    console.error("Error creating order items:", error)
    throw error
  }

  return data as OrderItem[]
}

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user orders:", error)
    throw error
  }

  return data as Order[]
}

export async function getOrderById(id: string) {
  try {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        console.warn(`Order with ID ${id} not found`)
        return null
      }
      console.error("Error fetching order:", error)
      throw new Error(`Failed to fetch order: ${error.message}`)
    }

    return data as Order
  } catch (error) {
    console.error("Database connection error or other error in getOrderById:", error)
    throw error // Re-throw to be handled by caller
  }
}

export async function getOrderItems(orderId: string) {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching order items:", error)
      throw new Error(`Failed to fetch order items: ${error.message}`)
    }

    return data as OrderItem[]
  } catch (error) {
    console.error("Database connection error or other error in getOrderItems:", error)
    throw error
  }
}

// Enhanced function to get order items with product images
export async function getOrderItemsWithImages(orderId: string) {
  try {
    console.log('Fetching order items with images for order:', orderId)
    
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        products:product_id (
          id,
          name,
          image,
          category
        )
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })

    console.log('Supabase query result:', { data, error })

    if (error) {
      console.error("Error fetching order items with images:", error)
      throw new Error(`Failed to fetch order items: ${error.message}`)
    }

    console.log('Returning order items:', data?.length || 0, 'items')
    return data || []
  } catch (error) {
    console.error("Database connection error or other error in getOrderItemsWithImages:", error)
    throw error
  }
}

// User Functions
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, profile: Partial<any>) {
  const { data, error } = await supabase.from("user_profiles").update(profile).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }

  return data
}

// Quote Functions
export async function getQuotes() {
  const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quotes:", error)
    throw error
  }

  return data as Quote[]
}

export async function createQuote(quote: Omit<Quote, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("quotes").insert([quote]).select().single()

  if (error) {
    console.error("Error creating quote:", error)
    throw error
  }

  return data as Quote
}

// Support Ticket Functions
export async function getSupportTickets() {
  const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching support tickets:", error)
    throw error
  }

  return data as SupportTicket[]
}

export async function createSupportTicket(ticket: Omit<SupportTicket, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("support_tickets").insert([ticket]).select().single()

  if (error) {
    console.error("Error creating support ticket:", error)
    throw error
  }

  return data as SupportTicket
}

export async function updateOrderPaymentStatus(orderId: string, status: string, paymentData?: any) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (paymentData) {
    updateData.payment_data = paymentData
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId)
    .select()
    .single()

  if (error) {
    console.error("Error updating order payment status:", error)
    throw error
  }

  return data as Order
}

export async function createOrderItem(orderItem: Omit<OrderItem, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("order_items")
    .insert([orderItem])
    .select()
    .single()

  if (error) {
    console.error("Error creating order item:", error)
    throw error
  }

  return data as OrderItem
}

// Multi-tenancy: Tenant type and helper
export type Tenant = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  brand_bg_color: string | null
  brand_ui_color: string | null
  email_from: string | null
  created_at: string
  updated_at: string | null
}

export async function getTenantBySlug(slug: string) {
  const { data, error } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (error) {
    console.error("Error fetching tenant by slug:", error)
    return null
  }

  return data as Tenant
}
