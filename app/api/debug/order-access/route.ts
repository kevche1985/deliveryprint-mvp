import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Create admin client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const debugInfo: any = {
      orderId,
      userId,
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // 1. Check if order exists at all
    const { data: orderExists, error: orderExistsError } = await adminClient
      .from('orders')
      .select('id, user_id, order_number, status, created_at')
      .eq('id', orderId)
      .single()

    debugInfo.checks.orderExists = {
      exists: !!orderExists,
      error: orderExistsError?.message,
      data: orderExists
    }

    if (!orderExists) {
      debugInfo.conclusion = 'Order does not exist in database'
      return NextResponse.json(debugInfo)
    }

    // 2. Check user profile if userId provided
    if (userId) {
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('id, role, email')
        .eq('id', userId)
        .single()

      debugInfo.checks.userProfile = {
        exists: !!userProfile,
        error: profileError?.message,
        data: userProfile
      }

      // 3. Check ownership
      debugInfo.checks.ownership = {
        userOwnsOrder: orderExists.user_id === userId,
        orderUserId: orderExists.user_id,
        requestUserId: userId,
        userIsAdmin: userProfile?.role === 'admin'
      }

      // 4. Test RLS policies with user context
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Simulate user session
      const { data: rlsTest, error: rlsError } = await userClient
        .from('orders')
        .select('id, user_id, order_number')
        .eq('id', orderId)
        .eq('user_id', userId)

      debugInfo.checks.rlsTest = {
        canAccess: !!rlsTest && rlsTest.length > 0,
        error: rlsError?.message,
        resultCount: rlsTest?.length || 0
      }

      // 5. Test admin access if user is admin
      if (userProfile?.role === 'admin') {
        const { data: adminTest, error: adminError } = await userClient
          .from('orders')
          .select('id, user_id, order_number')
          .eq('id', orderId)

        debugInfo.checks.adminAccess = {
          canAccess: !!adminTest && adminTest.length > 0,
          error: adminError?.message,
          resultCount: adminTest?.length || 0
        }
      }
    }

    // 6. Additional debug info
    debugInfo.checks.additionalInfo = {
      orderUserIdType: typeof orderExists.user_id,
      requestUserIdType: typeof userId,
      orderUserIdValue: orderExists.user_id,
      requestUserIdValue: userId
    }

    // Conclusion
    if (userId && orderExists) {
      if (orderExists.user_id === userId) {
        debugInfo.conclusion = 'User owns the order - should have access'
      } else if (debugInfo.checks.userProfile?.data?.role === 'admin') {
        debugInfo.conclusion = 'User is admin - should have access to any order'
      } else {
        debugInfo.conclusion = 'User does not own the order and is not admin - access denied is correct'
      }
    } else {
      debugInfo.conclusion = 'Need userId parameter to check access rights'
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Debug order access error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to get RLS policies (if available)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, userId } = body

    // This endpoint can be used to test specific scenarios
    return NextResponse.json({
      message: 'Use GET method with query parameters: ?orderId=xxx&userId=yyy'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}