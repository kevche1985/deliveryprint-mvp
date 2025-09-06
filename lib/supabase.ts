import { createClient } from "@supabase/supabase-js"

// Use environment variables instead of hardcoded values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dzlqddocovzijnfwygap.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bHFkZG9jb3Z6aWpuZnd5Z2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTI4MzMsImV4cCI6MjA2MzY4ODgzM30.HNBdMHhTwTiZbRWpJpLQuNMaUN1LrHe6AOBKC4ghaSk"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bHFkZG9jb3Z6aWpuZnd5Z2FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODExMjgzMywiZXhwIjoyMDYzNjg4ODMzfQ.PP02QkSVAZe4DfE1UnwMJ-XGPf4r1uQCMTzhH_j4tGA"

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL")
}

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase anon key")
}

console.log("Connecting to Supabase:", supabaseUrl)
console.log("Using anon key:", supabaseAnonKey.substring(0, 20) + "...")

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "X-Client-Info": "print-on-demand-mvp",
    },
  },
})

// Server-side client with service role key for admin operations
export const supabaseAdmin =
  typeof window === "undefined" && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        db: {
          schema: "public",
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            "X-Client-Info": "print-on-demand-admin",
          },
        },
      })
    : null

// Test connection function
export async function testConnection() {
  try {
    console.log("Testing Supabase connection to:", supabaseUrl)

    // Try to get session (this tests auth connection)
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error && error.message !== "Auth session missing!") {
      console.error("Connection test failed:", error)
      return false
    }

    console.log("Supabase connection successful")
    return true
  } catch (error) {
    console.error("Connection test error:", error)
    return false
  }
}

// Test table access
export async function testTableAccess() {
  try {
    console.log("Testing table access...")

    const { data, error } = await supabase.from("products").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Table access test failed:", error)
      return false
    }

    console.log("Table access successful, count:", data)
    return true
  } catch (error) {
    console.error("Table access error:", error)
    return false
  }
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          address: any | null
          role: "admin" | "operator" | "customer" | "supplier"
          status: "active" | "suspended" | "pending"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["user_profiles"]["Row"], "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string | null
          image: string | null
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          email: string
          status: string
          subtotal: number
          tax: number
          shipping: number
          discount: number
          total: number
          shipping_address: any | null
          billing_address: any | null
          payment_method: string | null
          shipping_method: string
          notes: string | null
          currency: string
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      quotes: {
        Row: {
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
      }
      support_tickets: {
        Row: {
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
      }
    }
  }
}
