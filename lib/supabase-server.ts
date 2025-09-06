import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables for server client")
}

// Server-side client with service role key
export const supabaseServer = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Export createClient for backward compatibility
export const createClient = () => supabaseServer

// Export createServerClient for backward compatibility
export const createServerClient = () => supabaseServer
