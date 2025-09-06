import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Basic environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString(),
    }

    // Test Supabase connection
    let dbStatus = "Not tested"
    let authStatus = "Not tested"
    let user = null

    try {
      const supabase = createClient()

      // Test database connection
      const { data: dbTest, error: dbError } = await supabase.from("products").select("count").limit(1)

      dbStatus = dbError ? `Error: ${dbError.message}` : "Connected"

      // Test auth
      const { data: authData, error: authError } = await supabase.auth.getUser()
      authStatus = authError ? `Error: ${authError.message}` : "Working"
      user = authData?.user ? { id: authData.user.id, email: authData.user.email } : null
    } catch (e) {
      dbStatus = `Exception: ${e instanceof Error ? e.message : String(e)}`
    }

    return NextResponse.json({
      message: "Debug endpoint is working",
      environment: envCheck,
      database: dbStatus,
      auth: authStatus,
      user: user,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
