import { createClient } from "@supabase/supabase-js"

// Connection configuration with keep-alive
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client with connection pooling and keep-alive
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      Connection: "keep-alive",
    },
  },
})

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Connection: "keep-alive",
    },
  },
})

// Test connection function
export async function testConnection() {
  try {
    const { data, error } = await supabaseClient
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(1)

    if (error) {
      console.error("Connection test failed:", error)
      return false
    }

    console.log("Database connection successful")
    return true
  } catch (err) {
    console.error("Connection error:", err)
    return false
  }
}

// Keep connection alive
setInterval(async () => {
  if (typeof window === "undefined") {
    // Only on server
    try {
      await supabaseAdmin.from("information_schema.tables").select("table_name").limit(1)
    } catch (err) {
      console.log("Keep-alive ping failed:", err)
    }
  }
}, 30000) // Ping every 30 seconds
