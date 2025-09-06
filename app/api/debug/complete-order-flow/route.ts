import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const userId = searchParams.get("userId")
    
    console.log(`🔍 Complete Order Flow Debug - Order: ${orderId}, User: ${userId}`)
    
    // Create service client for admin access
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    const debugResults: any = {
      timestamp: new Date().toISOString(),
      orderId,
      userId,
      steps: []
    }
    
    // Step 1: Check if order exists
    debugResults.steps.push("🔍 Step 1: Checking order existence...")
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()
    
    if (orderError || !order) {
      debugResults.steps.push(`❌ Order not found: ${orderError?.message}`)
      return NextResponse.json(debugResults, { status: 404 })
    }
    
    debugResults.order = {
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      created_at: order.created_at
    }
    debugResults.steps.push(`✅ Order found: ${order.order_number}`)
    
    // Step 2: Check order_items without joins
    debugResults.steps.push("🔍 Step 2: Checking basic order items...")
    const { data: basicOrderItems, error: basicItemsError } = await supabaseService
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
    
    debugResults.basicOrderItems = basicOrderItems?.map(item => ({
      id: item.id,
      name: item.name,
      digital_product_id: item.digital_product_id,
      product_image_url: item.product_image_url,
      design_image_url: item.design_image_url,
      customized_image_url: item.customized_image_url,
      print_ready_file_url: item.print_ready_file_url
    })) || []
    
    debugResults.steps.push(`✅ Found ${basicOrderItems?.length || 0} order items`)
    
    // Step 3: Check order_items with digital products join
    debugResults.steps.push("🔍 Step 3: Checking order items with digital products join...")
    const { data: joinedOrderItems, error: joinError } = await supabaseService
      .from("order_items")
      .select(`
        *,
        digital_product:digital_products (
          id,
          download_url,
          preview_url,
          type,
          name
        )
      `)
      .eq("order_id", orderId)
    
    if (joinError) {
      debugResults.steps.push(`❌ Join error: ${joinError.message}`)
    } else {
      debugResults.joinedOrderItems = joinedOrderItems?.map(item => ({
        id: item.id,
        name: item.name,
        digital_product_id: item.digital_product_id,
        digital_product: item.digital_product,
        hasDigitalProduct: !!item.digital_product,
        imageUrls: {
          digital_download: item.digital_product?.download_url,
          digital_preview: item.digital_product?.preview_url,
          customized: item.customized_image_url,
          design: item.design_image_url,
          product: item.product_image_url
        }
      })) || []
      debugResults.steps.push(`✅ Join successful, ${joinedOrderItems?.length || 0} items with digital products`)
    }
    
    // Step 4: Check all digital products for this user
    debugResults.steps.push("🔍 Step 4: Checking user's digital products...")
    const { data: userDigitalProducts, error: digitalError } = await supabaseService
      .from("digital_products")
      .select("*")
      .eq("user_id", order.user_id)
      .order("created_at", { ascending: false })
    
    debugResults.userDigitalProducts = userDigitalProducts?.map(product => ({
      id: product.id,
      name: product.name,
      type: product.type,
      status: product.status,
      download_url: product.download_url,
      preview_url: product.preview_url,
      created_at: product.created_at,
      linkedToOrderItem: basicOrderItems?.some(item => item.digital_product_id === product.id)
    })) || []
    
    debugResults.steps.push(`✅ Found ${userDigitalProducts?.length || 0} digital products for user`)
    
    // Step 5: Check recent orders for this user
    debugResults.steps.push("🔍 Step 5: Checking recent orders for context...")
    const { data: recentOrders, error: recentOrdersError } = await supabaseService
      .from("orders")
      .select("id, order_number, created_at, status")
      .eq("user_id", order.user_id)
      .order("created_at", { ascending: false })
      .limit(5)
    
    debugResults.recentOrders = recentOrders || []
    debugResults.steps.push(`✅ Found ${recentOrders?.length || 0} recent orders`)
    
    // Step 6: Test the exact query used by admin orders page
    debugResults.steps.push("🔍 Step 6: Testing admin orders page query...")
    const { data: adminQuery, error: adminError } = await supabaseService
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          name,
          quantity,
          price,
          customizations,
          design_file_url,
          product_image_url,
          design_image_url,
          customized_image_url,
          print_ready_file_url,
          product_id,
          digital_product_id,
          digital_product:digital_products (
            id,
            download_url,
            preview_url,
            type
          )
        )
      `)
      .eq("id", orderId)
      .single()
    
    if (adminError) {
      debugResults.steps.push(`❌ Admin query error: ${adminError.message}`)
    } else {
      debugResults.adminQueryResult = {
        order_id: adminQuery.id,
        order_items_count: adminQuery.order_items?.length || 0,
        items_with_digital_products: adminQuery.order_items?.filter((item: any) => item.digital_product).length || 0,
        items_with_images: adminQuery.order_items?.filter((item: any) => 
          item.digital_product?.download_url || 
          item.digital_product?.preview_url || 
          item.customized_image_url || 
          item.design_image_url || 
          item.product_image_url
        ).length || 0,
        sample_item: adminQuery.order_items?.[0] ? {
          id: adminQuery.order_items[0].id,
          name: adminQuery.order_items[0].name,
          digital_product_id: adminQuery.order_items[0].digital_product_id,
          has_digital_product: !!adminQuery.order_items[0].digital_product,
          available_images: {
            digital_download: adminQuery.order_items[0].digital_product?.download_url,
            digital_preview: adminQuery.order_items[0].digital_product?.preview_url,
            customized: adminQuery.order_items[0].customized_image_url,
            design: adminQuery.order_items[0].design_image_url,
            product: adminQuery.order_items[0].product_image_url
          }
        } : null
      }
      debugResults.steps.push(`✅ Admin query successful`)
    }
    
    // Step 7: Analysis and recommendations
    debugResults.steps.push("🔍 Step 7: Analyzing results...")
    
    const analysis = {
      hasOrder: !!order,
      hasOrderItems: (basicOrderItems?.length || 0) > 0,
      hasDigitalProductIds: basicOrderItems?.some(item => item.digital_product_id) || false,
      hasUserDigitalProducts: (userDigitalProducts?.length || 0) > 0,
      joinWorking: !joinError && (joinedOrderItems?.length || 0) > 0,
      adminQueryWorking: !adminError,
      itemsWithImages: debugResults.adminQueryResult?.items_with_images || 0,
      possibleIssues: [] as string[],
      recommendations: [] as string[]
    }
    
    // Identify issues
    if (!analysis.hasOrderItems) {
      analysis.possibleIssues.push("No order items found for this order")
      analysis.recommendations.push("Check if order was created properly during checkout")
    }
    
    if (analysis.hasOrderItems && !analysis.hasDigitalProductIds) {
      analysis.possibleIssues.push("Order items exist but no digital_product_id values")
      analysis.recommendations.push("Check payment confirmation API - it should create order items with digital_product_id")
    }
    
    if (analysis.hasUserDigitalProducts && !analysis.hasDigitalProductIds) {
      analysis.possibleIssues.push("User has digital products but they're not linked to order items")
      analysis.recommendations.push("The payment confirmation process is not creating the proper links")
    }
    
    if (!analysis.joinWorking) {
      analysis.possibleIssues.push("Database join between order_items and digital_products failed")
      analysis.recommendations.push("Check RLS policies and foreign key constraints")
    }
    
    if (analysis.itemsWithImages === 0 && analysis.hasOrderItems) {
      analysis.possibleIssues.push("Order items exist but no images are available")
      analysis.recommendations.push("Check if digital products have download_url or preview_url populated")
    }
    
    debugResults.analysis = analysis
    debugResults.steps.push(`✅ Analysis complete - Found ${analysis.possibleIssues.length} issues`)
    
    // Final summary
    debugResults.summary = {
      status: analysis.possibleIssues.length === 0 ? "SUCCESS" : "ISSUES_FOUND",
      message: analysis.possibleIssues.length === 0 
        ? "Order flow appears to be working correctly" 
        : `Found ${analysis.possibleIssues.length} issues that need to be addressed`,
      nextSteps: analysis.possibleIssues.length > 0 
        ? analysis.recommendations 
        : ["Images should be visible in the order details"]
    }
    
    console.log(`📊 Debug Summary for ${orderId}:`, debugResults.summary)
    
    return NextResponse.json(debugResults, { status: 200 })
    
  } catch (error: any) {
    console.error("💥 Critical error in complete order flow debug:", error)
    return NextResponse.json({
      error: error.message || 'Unknown error occurred during debug',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}