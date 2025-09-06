import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering for this API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get("orderNumber")
    
    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }
    
    console.log(`🔍 Debugging order: ${orderNumber}`)
    
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
    
    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single()
    
    if (orderError) {
      console.error("❌ Order fetch error:", orderError)
      return NextResponse.json({ error: "Order not found", details: orderError }, { status: 404 })
    }
    
    // Get order items
    const { data: orderItems, error: itemsError } = await supabaseService
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
    
    if (itemsError) {
      console.error("❌ Order items fetch error:", itemsError)
    }
    
    // Get digital products associated with this order
    const { data: digitalProducts, error: digitalError } = await supabaseService
      .from("digital_products")
      .select("*")
      .eq("user_id", order.user_id)
    
    if (digitalError) {
      console.error("❌ Digital products fetch error:", digitalError)
    }
    
    // Filter digital products that might be related to this order
    const relatedDigitalProducts = digitalProducts?.filter(product => {
      // Check if product was created around the same time as the order
      const orderTime = new Date(order.created_at).getTime()
      const productTime = new Date(product.created_at).getTime()
      const timeDiff = Math.abs(orderTime - productTime)
      const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
      
      return timeDiff <= oneHour || 
             (product.metadata && product.metadata.order_id === order.id) ||
             product.name.toLowerCase().includes("whatever comes to your mind")
    }) || []
    
    // Check for payment confirmations in logs (if any)
    const debugInfo = {
      orderNumber,
      order: {
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        payment_status: order.payment_status,
        total: order.total,
        created_at: order.created_at,
        updated_at: order.updated_at,
        transaction_id: order.transaction_id,
        payment_method: order.payment_method
      },
      orderItems: orderItems?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        product_id: item.product_id,
        design_id: item.design_id,
        design_image_url: item.design_image_url,
        design_file_url: item.design_file_url
      })) || [],
      allDigitalProducts: digitalProducts?.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        status: product.status,
        created_at: product.created_at,
        metadata: product.metadata,
        base_price: product.base_price
      })) || [],
      relatedDigitalProducts: relatedDigitalProducts.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        status: product.status,
        created_at: product.created_at,
        metadata: product.metadata,
        base_price: product.base_price,
        timeDiffFromOrder: Math.abs(new Date(order.created_at).getTime() - new Date(product.created_at).getTime()) / (1000 * 60) // in minutes
      })),
      analysis: {
        orderPaid: order.payment_status === 'paid' || order.status === 'completed',
        hasDigitalProducts: relatedDigitalProducts.length > 0,
        unpurchasedDigitalProducts: relatedDigitalProducts.filter(p => p.status === 'unpurchased'),
        purchasedDigitalProducts: relatedDigitalProducts.filter(p => p.status === 'purchased'),
        possibleIssues: [] as string[]
      }
    }
    
    // Analyze potential issues
    if (debugInfo.analysis.orderPaid && debugInfo.analysis.unpurchasedDigitalProducts.length > 0) {
      debugInfo.analysis.possibleIssues.push("Order is paid but has unpurchased digital products")
    }
    
    if (debugInfo.analysis.hasDigitalProducts && !order.transaction_id) {
      debugInfo.analysis.possibleIssues.push("Digital products exist but no transaction ID in order")
    }
    
    const unpurchasedWithoutOrderId = debugInfo.analysis.unpurchasedDigitalProducts.filter(
      p => !p.metadata?.order_id
    )
    if (unpurchasedWithoutOrderId.length > 0) {
      debugInfo.analysis.possibleIssues.push("Unpurchased digital products missing order_id in metadata")
    }
    
    console.log(`📊 Debug analysis for ${orderNumber}:`, debugInfo.analysis)
    
    return NextResponse.json(debugInfo, { status: 200 })
    
  } catch (error: any) {
    console.error("💥 Critical error in order debug:", error)
    return NextResponse.json({
      error: error.message || 'Unknown error occurred during order debug',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}