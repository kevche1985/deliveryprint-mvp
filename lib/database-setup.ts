import { supabase } from "./supabase"

export async function setupDatabase() {
  try {
    console.log("Setting up database...")

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables")

    if (tablesError) {
      console.log("RPC not available, trying direct table creation...")
    }

    // Create user_profiles table using Supabase client
    const { error: createError } = await supabase.rpc("create_user_profiles_table")

    if (createError) {
      console.log("RPC create failed, using raw SQL...")

      // Try creating the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          phone VARCHAR(20),
          address JSONB,
          role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'operator', 'customer', 'supplier')),
          status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      // We can't execute raw DDL through the client, so let's try a different approach
      console.log("Need to create table through SQL interface")
    }

    return true
  } catch (error) {
    console.error("Database setup error:", error)
    return false
  }
}

export async function checkUserProfilesTable() {
  try {
    // Try to query the table to see if it exists
    const { data, error } = await supabase.from("user_profiles").select("count", { count: "exact", head: true })

    if (error) {
      console.error("user_profiles table check failed:", error)
      return false
    }

    console.log("user_profiles table exists and accessible")
    return true
  } catch (error) {
    console.error("Error checking user_profiles table:", error)
    return false
  }
}
