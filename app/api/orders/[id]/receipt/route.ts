import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    
    // Get order using server-side Supabase
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      console.error('Order fetch error:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    // Get order items
    const { data: orderItems, error: itemsError } = await supabaseServer
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (itemsError) {
      console.error('Order items fetch error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 })
    }
    
    // Ensure orderItems is an array (even if empty)
    const safeOrderItems = orderItems || []

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate receipt content
    generateReceiptPDF(doc, order, safeOrderItems)
    
    doc.end()
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        
        resolve(new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Receipt_${order.order_number}.pdf"`,
          },
        }))
      })
    })
  } catch (error) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

function generateReceiptPDF(doc: PDFKit.PDFDocument, order: any, orderItems: any[]) {
  // Header
  doc.fontSize(24).text('RECEIPT', { align: 'center' })
  doc.fontSize(16).text('DeliveryPrint', { align: 'center' })
  doc.moveDown()
  
  // Order info
  doc.fontSize(12)
  doc.text(`Receipt #: ${order.order_number}`, 50, doc.y)
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 50, doc.y)
  doc.text(`Customer: ${order.billing_address?.firstName || ''} ${order.billing_address?.lastName || ''}`, 50, doc.y)
  doc.moveDown()
  
  // Items table header
  const tableTop = doc.y
  doc.text('Item', 50, tableTop)
  doc.text('Qty', 300, tableTop)
  doc.text('Price', 400, tableTop)
  doc.text('Total', 500, tableTop)
  
  // Draw line
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke()
  doc.moveDown()
  
  // Items
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach((item) => {
      const itemY = doc.y
      doc.text(item.name || 'Unknown Item', 50, itemY)
      doc.text((item.quantity || 1).toString(), 300, itemY)
      doc.text(`$${(item.price || 0).toFixed(2)}`, 400, itemY)
      doc.text(`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 500, itemY)
      doc.moveDown()
    })
  } else {
    doc.text('No items found for this order', 50, doc.y)
    doc.moveDown()
  }
  
  // Totals
  doc.moveDown()
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 400, doc.y)
  doc.text(`Shipping: $${order.shipping.toFixed(2)}`, 400, doc.y)
  doc.text(`Tax: $${order.tax.toFixed(2)}`, 400, doc.y)
  doc.fontSize(14).text(`Total: $${order.total.toFixed(2)}`, 400, doc.y)
  
  // Payment info
  doc.moveDown()
  doc.fontSize(12)
  doc.text(`Payment Method: ${order.payment_method.toUpperCase()}`, 50, doc.y)
  doc.text(`Status: ${order.payment_status || 'Paid'}`, 50, doc.y)
  
  // Footer
  doc.moveDown(2)
  doc.fontSize(10)
  doc.text('Thank you for your business!', { align: 'center' })
}