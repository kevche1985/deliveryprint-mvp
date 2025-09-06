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

    // Generate invoice number if not exists
    let invoiceNumber = (order as any).invoice_number
    if (!invoiceNumber) {
      invoiceNumber = `INV-${Date.now()}`
      
      // Update order with invoice number
      await supabaseServer
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', orderId)
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate invoice content
    generateInvoicePDF(doc, order, safeOrderItems, invoiceNumber)
    
    doc.end()
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        
        resolve(new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Invoice_${invoiceNumber}.pdf"`,
          },
        }))
      })
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

function generateInvoicePDF(doc: PDFKit.PDFDocument, order: any, orderItems: any[], invoiceNumber: string) {
  // Header with company info
  doc.fontSize(24).text('INVOICE', { align: 'center' })
  doc.fontSize(18).text('DeliveryPrint', { align: 'center' })
  doc.fontSize(12).text('Professional Printing Services', { align: 'center' })
  doc.moveDown(2)
  
  // Invoice details
  doc.text(`Invoice #: ${invoiceNumber}`, 50, doc.y)
  doc.text(`Order #: ${order.order_number}`, 50, doc.y)
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 50, doc.y)
  doc.text(`Due Date: ${new Date().toLocaleDateString()}`, 50, doc.y)
  doc.moveDown()
  
  // Bill to section
  doc.fontSize(14).text('Bill To:', 50, doc.y)
  doc.fontSize(12)
  doc.text(`${order.billing_address?.firstName || ''} ${order.billing_address?.lastName || ''}`, 50, doc.y)
  doc.text(order.billing_address?.address || '', 50, doc.y)
  doc.text(`${order.billing_address?.city || ''}, ${order.billing_address?.state || ''} ${order.billing_address?.zipCode || ''}`, 50, doc.y)
  doc.text(order.email, 50, doc.y)
  doc.moveDown(2)
  
  // Items table
  const tableTop = doc.y
  doc.fontSize(12)
  doc.text('Description', 50, tableTop)
  doc.text('Qty', 300, tableTop)
  doc.text('Unit Price', 380, tableTop)
  doc.text('Total', 480, tableTop)
  
  // Draw line
  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke()
  doc.moveDown()
  
  // Items
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach((item) => {
      const itemY = doc.y
      doc.text(item.name || 'Unknown Item', 50, itemY, { width: 240 })
      doc.text((item.quantity || 1).toString(), 300, itemY)
      doc.text(`$${(item.price || 0).toFixed(2)}`, 380, itemY)
      doc.text(`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 480, itemY)
      doc.moveDown()
    })
  } else {
    doc.text('No items found for this order', 50, doc.y)
    doc.moveDown()
  }
  
  // Totals section
  doc.moveDown()
  const totalsX = 400
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, totalsX, doc.y)
  doc.text(`Shipping: $${order.shipping.toFixed(2)}`, totalsX, doc.y)
  doc.text(`Tax: $${order.tax.toFixed(2)}`, totalsX, doc.y)
  doc.fontSize(14).text(`Total: $${order.total.toFixed(2)}`, totalsX, doc.y)
  
  // Payment info
  doc.moveDown(2)
  doc.fontSize(12)
  doc.text('Payment Information:', 50, doc.y)
  doc.text(`Method: ${order.payment_method.toUpperCase()}`, 50, doc.y)
  doc.text(`Status: ${order.payment_status || 'Paid'}`, 50, doc.y)
  if (order.payment_transaction_id) {
    doc.text(`Transaction ID: ${order.payment_transaction_id}`, 50, doc.y)
  }
  
  // Footer
  doc.moveDown(3)
  doc.fontSize(10)
  doc.text('Thank you for your business!', { align: 'center' })
  doc.text('For questions about this invoice, please contact support@deliveryprint.com', { align: 'center' })
}