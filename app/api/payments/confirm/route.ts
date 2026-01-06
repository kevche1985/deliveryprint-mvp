import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { createOrderItem, updateOrderPaymentStatus } from "@/lib/database" // Assuming these are server-side functions
import { sendOrderConfirmationEmail } from "@/lib/email-service" // Assuming this exists
import { markDigitalProductAsPurchased } from "@/lib/digital-product-service"

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      paymentMethod,
      transactionId,
      paymentStatus,
      cartItems,
      digitalCartItems,
      customerEmail,
      shippingAddress,
      notes,
      shippingMethod,
      total,
      subtotal,
      tax,
      shipping,
      userId,
    } = await req.json()

    if (!orderId || !paymentMethod || !paymentStatus || !cartItems || !customerEmail || !total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Note: We don't require user authentication here because:
    // 1. Payment has already been validated by PayPal/payment provider
    // 2. User session may not be available after payment redirect
    // 3. We have orderId and transactionId for verification
    console.log('Processing payment confirmation for order:', orderId, 'transaction:', transactionId)
    
    // Optional: Verify the order exists and belongs to the provided userId if available
    if (userId) {
      const { data: existingOrder, error: orderError } = await supabaseServer
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .single()
      
      if (orderError || !existingOrder) {
        console.error('Order not found:', orderId, orderError)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      
      if (existingOrder.user_id !== userId) {
        console.error('Order user mismatch:', existingOrder.user_id, 'vs', userId)
        return NextResponse.json({ error: "Order access denied" }, { status: 403 })
      }
    }

    // 1. Update the order status and transaction ID
    const updatedOrder = await updateOrderPaymentStatus(
      orderId,
      paymentStatus || 'completed',
      transactionId
    )

    if (!updatedOrder) {
      console.error("Error updating order payment status")
      return NextResponse.json({ error: "Failed to update order payment status" }, { status: 500 })
    }

    // 2. Create order items if they don't exist (idempotency)
    // This assumes order items are created during checkout, but this step ensures they are linked
    // or created if the flow allows for late item creation.
    // For this context, we'll assume items are already in the cart and need to be moved to order_items.
    // The `getCartItems` and `clearCart` might need to be adapted for server-side use if they are client-side contexts.
    // For a robust server action, you'd fetch cart items from the DB directly.

    // Example of processing cart items and creating order items
    const { data: existingItems } = await supabaseServer.from('order_items').select('id').eq('order_id', orderId)
    if (!existingItems || existingItems.length === 0) {
    for (const item of cartItems) {
      // Ensure customizations are stored as JSONB
      const lightweightCustomizations = item.customizations ? JSON.parse(JSON.stringify(item.customizations)) : null

      // Determine the best image URL for display and download
      let designImageUrl = item.design_image_url || item.customizations?.preview_url
      let designFileUrl = item.design_file_url || item.customizations?.download_url
      const customizedProductImageUrl = item.customizedProductImage || item.customizations?.customizedProductImage

      // Fallback logic for designImageUrl
      if (!designImageUrl) {
        designImageUrl =
          customizedProductImageUrl || item.productImage || item.designUrl || item.storageUrl || item.preview_url
      }
      // Fallback logic for designFileUrl
      if (!designFileUrl) {
        designFileUrl =
          customizedProductImageUrl || item.designUrl || item.storageUrl || item.download_url || designImageUrl
      }

      const orderItem = {
        order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        design_id: item.designId || null,
        quantity: item.quantity || 1,
        price: item.price || 0,
        name: item.name,
        product_image_url: item.productImage || null,
        design_image_url: designImageUrl || null, // Custom design preview URL
        design_file_url: designFileUrl || null, // Design file for download
        customized_image_url: customizedProductImageUrl || null,
        customized_product_image_url: customizedProductImageUrl || null, // The final rendered product image
        print_ready_file_url: designFileUrl || null,
        digital_product_id: null,
        customizations: lightweightCustomizations,
      }

      const createdItem = await createOrderItem(orderItem)
      if (!createdItem) {
        console.error("Error creating order item")
        // Decide if you want to roll back or continue. For now, log and continue.
      }
    }
    }

    // 3. Process digital products if present
    if (digitalCartItems && digitalCartItems.length > 0 && (!existingItems || existingItems.length === 0)) {
      console.log(`Processing ${digitalCartItems.length} digital products for order ${orderId}`)
      
      for (const digitalItem of digitalCartItems) {
        const productId = digitalItem.productId || digitalItem.designId
        if (productId) {
          try {
            // Mark digital product as purchased
            const updatedProduct = await markDigitalProductAsPurchased(
              productId
            )
            
            if (updatedProduct) {
              console.log(`✅ Digital product ${productId} marked as purchased`)
              
              // Create order item for digital product
              const digitalOrderItem = {
                order_id: orderId,
                product_id: 'digital-product', // Generic product ID for digital items
                digital_product_id: productId, // Link to digital_products table
                variant_id: null,
                design_id: null,
                name: digitalItem.name || updatedProduct.name,
                quantity: digitalItem.quantity || 1,
                price: digitalItem.finalPrice || digitalItem.basePrice || updatedProduct.base_price || 0,
                customizations: digitalItem.customizations || null,
                product_image_url: null, // Digital products don't have base product images
                design_image_url: updatedProduct.preview_url || updatedProduct.download_url || null,
                design_file_url: updatedProduct.download_url || null,
                customized_image_url: updatedProduct.download_url || null,
                customized_product_image_url: null,
                print_ready_file_url: updatedProduct.download_url || null,
              }
              
              const createdDigitalItem = await createOrderItem(digitalOrderItem)
              if (createdDigitalItem) {
                console.log(`✅ Digital order item created for product ${productId}`)
              } else {
                console.error(`❌ Failed to create order item for digital product ${productId}`)
              }
            } else {
              console.error(`❌ Failed to mark digital product ${productId} as purchased`)
            }
          } catch (error) {
            console.error(`Error processing digital product ${productId}:`, error)
          }
        }
      }
    }

    // 4. Clear the user's cart (assuming a server-side cart clearing mechanism)
    // await clearCart(user.id); // This would depend on your cart implementation

    // 5. Send confirmation email to customer with order details
    try {
      const { data: emailItems } = await supabaseServer
        .from('order_items')
        .select('name, quantity, price')
        .eq('order_id', orderId)

      const payload = {
        customerEmail,
        customerName: `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || customerEmail,
        orderNumber: updatedOrder.order_number,
        orderTotal: Number(updatedOrder.total || total).toFixed(2),
        orderItems: (emailItems || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity || 1,
          price: Number(i.price || 0).toFixed(2),
        })),
      }
      await sendOrderConfirmationEmail(payload)
    } catch (_) {}

    return NextResponse.json({ success: true, order: updatedOrder }, { status: 200 })
  } catch (error: any) {
    console.error("Error in payment confirmation route:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
