import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get all users from auth.users (requires service role key)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
    }
    
    // Combine auth users with profiles
    const usersWithProfiles = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone,
        email_confirmed_at: authUser.email_confirmed_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        last_sign_in_at: authUser.last_sign_in_at,
        // Profile data
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        role: profile?.role || 'customer',
        status: profile?.status || 'pending',
        profile_created_at: profile?.created_at,
        profile_updated_at: profile?.updated_at
      }
    })
    
    return NextResponse.json({ users: usersWithProfiles })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    console.log('Creating user with data:', { 
      email: body.email, 
      first_name: body.first_name, 
      last_name: body.last_name, 
      role: body.role 
    })
    
    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password || 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role
      }
    })
    
    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ 
        error: 'Failed to create user', 
        details: authError.message,
        code: 'AUTH_ERROR' 
      }, { status: 500 })
    }
    
    console.log('Auth user created successfully:', authUser.user.id)
    
    // Create service role client for profile creation (bypasses RLS)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Create user profile using service role
    const { data: profile, error: profileError } = await supabaseService
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone || null,
        role: body.role || 'customer',
        status: body.status || 'active'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      console.error('Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      
      // Try to clean up the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json({ 
        error: 'Database error saving new user',
        details: profileError.message,
        code: 'PROFILE_ERROR'
      }, { status: 500 })
    }
    
    console.log('User profile created successfully:', profile.id)
    
    return NextResponse.json({ 
      user: {
        ...authUser.user,
        ...profile
      }
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ 
      error: 'Database error saving new user',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'unexpected_failure'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Update user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        phone: body.phone,
        role: body.role,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()
    
    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
    }
    
    // Update auth user metadata if needed
    if (body.email && body.email !== body.current_email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(body.id, {
        email: body.email,
        user_metadata: {
          first_name: body.first_name,
          last_name: body.last_name
        }
      })
      
      if (authError) {
        console.error('Error updating auth user:', authError)
        return NextResponse.json({ error: 'Failed to update user email' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const hard = searchParams.get('hard') === 'true'
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check for dependencies before deletion
    const dependencies = await checkUserDependencies(supabase, id)
    
    if (dependencies.length > 0 && hard) {
      const dependencyMessage = dependencies.map(dep => 
        `${dep.count} ${dep.table}${dep.count > 1 ? 's' : ''}`
      ).join(', ')
      
      return NextResponse.json({ 
        error: `Cannot delete user. User has dependencies in: ${dependencyMessage}. Please remove or reassign these records first.`,
        dependencies: dependencies
      }, { status: 400 })
    }
    
    if (hard) {
      // Hard delete: remove from auth.users and user_profiles
      const { error: authError } = await supabase.auth.admin.deleteUser(id)
      
      if (authError) {
        console.error('Error deleting auth user:', authError)
        return NextResponse.json({ 
          error: 'Failed to delete user from authentication system',
          details: authError.message 
        }, { status: 500 })
      }
      
      // Profile will be deleted by cascade or trigger
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)
      
      if (profileError) {
        console.error('Error deleting profile:', profileError)
        return NextResponse.json({ 
          error: 'Failed to delete user profile',
          details: profileError.message 
        }, { status: 500 })
      }
    } else {
      // Soft delete: just update status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (profileError) {
        console.error('Error soft deleting user:', profileError)
        return NextResponse.json({ 
          error: 'Failed to suspend user',
          details: profileError.message 
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to check user dependencies
async function checkUserDependencies(supabase: any, userId: string) {
  const dependencies = []
  
  try {
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
    
    if (!ordersError && orders && orders.length > 0) {
      dependencies.push({ table: 'order', count: orders.length })
    }
    
    // Check quotes as customer
    const { data: customerQuotes, error: customerQuotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('customer_id', userId)
    
    if (!customerQuotesError && customerQuotes && customerQuotes.length > 0) {
      dependencies.push({ table: 'quote (as customer)', count: customerQuotes.length })
    }
    
    // Check quotes created by user
    const { data: createdQuotes, error: createdQuotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('created_by', userId)
    
    if (!createdQuotesError && createdQuotes && createdQuotes.length > 0) {
      dependencies.push({ table: 'quote (created)', count: createdQuotes.length })
    }
    
    // Check quotes assigned to user
    const { data: assignedQuotes, error: assignedQuotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('assigned_to', userId)
    
    if (!assignedQuotesError && assignedQuotes && assignedQuotes.length > 0) {
      dependencies.push({ table: 'quote (assigned)', count: assignedQuotes.length })
    }
    
    // Check digital products
    const { data: digitalProducts, error: digitalProductsError } = await supabase
      .from('digital_products')
      .select('id')
      .eq('user_id', userId)
    
    if (!digitalProductsError && digitalProducts && digitalProducts.length > 0) {
      dependencies.push({ table: 'digital product', count: digitalProducts.length })
    }
    
    // Check digital orders
    const { data: digitalOrders, error: digitalOrdersError } = await supabase
      .from('digital_orders')
      .select('id')
      .eq('user_id', userId)
    
    if (!digitalOrdersError && digitalOrders && digitalOrders.length > 0) {
      dependencies.push({ table: 'digital order', count: digitalOrders.length })
    }
    
    // Check digital downloads
    const { data: digitalDownloads, error: digitalDownloadsError } = await supabase
      .from('digital_downloads')
      .select('id')
      .eq('user_id', userId)
    
    if (!digitalDownloadsError && digitalDownloads && digitalDownloads.length > 0) {
      dependencies.push({ table: 'digital download', count: digitalDownloads.length })
    }
    
    // Check cart items
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', userId)
    
    if (!cartItemsError && cartItems && cartItems.length > 0) {
      dependencies.push({ table: 'cart item', count: cartItems.length })
    }
    
    // Check support tickets as customer
    const { data: supportTickets, error: supportTicketsError } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('customer_id', userId)
    
    if (!supportTicketsError && supportTickets && supportTickets.length > 0) {
      dependencies.push({ table: 'support ticket', count: supportTickets.length })
    }
    
    // Check designs
    const { data: designs, error: designsError } = await supabase
      .from('designs')
      .select('id')
      .eq('user_id', userId)
    
    if (!designsError && designs && designs.length > 0) {
      dependencies.push({ table: 'design', count: designs.length })
    }
    
  } catch (error) {
    console.error('Error checking dependencies:', error)
  }
  
  return dependencies
}