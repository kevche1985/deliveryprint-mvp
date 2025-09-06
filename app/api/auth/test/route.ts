import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log("Auth test API called")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    console.log("Auth header:", authHeader ? "Present" : "Missing")

    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Try to get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("User from auth:", user?.id || "No user")
    console.log("Auth error:", authError?.message || "No error")

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication failed", details: authError?.message }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
      },
    })
  } catch (error: any) {
    console.error("Error in auth test API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
