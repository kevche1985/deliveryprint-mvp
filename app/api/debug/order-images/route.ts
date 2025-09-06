import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }
    
    console.log(`🔍 Debugging order images for: ${orderId}`)
    
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
    
    // 1. Check order exists
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()
    
    if (orderError) {
      console.error("❌ Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found", details: orderError }, { status: 404 })
    }
    
    // 2. Check order items with digital_product_id
    const { data: orderItems, error: itemsError } = await supabaseService
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
    
    if (itemsError) {
      console.error("❌ Order items fetch error:", itemsError)
    }
    
    // 3. Check order items with digital products join
    const { data: orderItemsWithDigital, error: joinError } = await supabaseService
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
      console.error("❌ Order items with digital products join error:", joinError)
    }
    
    // 4. Check all digital products for this user
    const { data: userDigitalProducts, error: digitalError } = await supabaseService
      .from("digital_products")
      .select("*")
      .eq("user_id", order.user_id)
    
    if (digitalError) {
      console.error("❌ Digital products fetch error:", digitalError)
    }
    
    // 5. Check if order_items table has digital_product_id column
    const { data: tableStructure, error: structureError } = await supabaseService
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "order_items")
      .eq("table_schema", "public")
    
    if (structureError) {
      console.error("❌ Table structure fetch error:", structureError)
    }
    
    // 6. Check recent digital products with images
    const { data: recentDigitalProducts, error: recentError } = await supabaseService
      .from("digital_products")
      .select("id, name, download_url, preview_url, type, created_at")
      .not("download_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
    
    if (recentError) {
      console.error("❌ Recent digital products fetch error:", recentError)
    }
    
    const debugInfo = {
      orderId,
      order: {
        id: order.id,
        user_id: order.user_id,
        order_number: order.order_number,
        created_at: order.created_at
      },
      orderItems: orderItems?.map(item => ({
        id: item.id,
        name: item.name,
        digital_product_id: item.digital_product_id,
        design_file_url: item.design_file_url,
        product_image_url: item.product_image_url,
        design_image_url: item.design_image_url,
        customized_image_url: item.customized_image_url
      })) || [],
      orderItemsWithDigitalJoin: orderItemsWithDigital?.map(item => ({
        id: item.id,
        name: item.name,
        digital_product_id: item.digital_product_id,
        digital_product: item.digital_product
      })) || [],
      userDigitalProducts: userDigitalProducts?.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        download_url: product.download_url,
        preview_url: product.preview_url,
        created_at: product.created_at
      })) || [],
      tableStructure: tableStructure || [],
      recentDigitalProducts: recentDigitalProducts || [],
      analysis: {
        hasOrderItems: (orderItems?.length || 0) > 0,
        orderItemsWithDigitalProductId: orderItems?.filter(item => item.digital_product_id).length || 0,
        digitalProductsWithImages: userDigitalProducts?.filter(p => p.download_url || p.preview_url).length || 0,
        hasDigitalProductIdColumn: tableStructure?.some(col => col.column_name === 'digital_product_id') || false,
        joinWorking: (orderItemsWithDigital?.length || 0) > 0,
        possibleIssues: [] as string[]
      }
    }
    
    // Analyze potential issues
    if (!debugInfo.analysis.hasDigitalProductIdColumn) {
      debugInfo.analysis.possibleIssues.push("order_items table missing digital_product_id column")
    }
    
    if (debugInfo.analysis.hasOrderItems && debugInfo.analysis.orderItemsWithDigitalProductId === 0) {
      debugInfo.analysis.possibleIssues.push("Order items exist but none have digital_product_id populated")
    }
    
    if (debugInfo.analysis.digitalProductsWithImages > 0 && debugInfo.analysis.orderItemsWithDigitalProductId === 0) {
      debugInfo.analysis.possibleIssues.push("User has digital products with images but they're not linked to order items")
    }
    
    if (!debugInfo.analysis.joinWorking) {
      debugInfo.analysis.possibleIssues.push("Database join between order_items and digital_products not working")
    }
    
    console.log(`📊 Debug analysis for ${orderId}:`, debugInfo.analysis)
    
    return NextResponse.json(debugInfo, { status: 200 })
    
  } catch (error: any) {
    console.error("💥 Critical error in order images debug:", error)
    return NextResponse.json({
      error: error.message || 'Unknown error occurred during debug',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}