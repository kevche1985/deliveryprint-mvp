import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    console.log('🧾 Invoice generation requested for order ID:', orderId)
    
    // Validate order ID format
    if (!orderId || orderId.trim() === '') {
      console.error('❌ Invalid order ID provided:', orderId)
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }
    
    // Get order using server-side Supabase
    console.log('📊 Fetching order from database...')
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError) {
      console.error('❌ Order fetch error:', orderError)
      return NextResponse.json({ 
        error: 'Failed to fetch order', 
        details: orderError.message 
      }, { status: 500 })
    }
    
    if (!order) {
      console.error('❌ Order not found for ID:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    console.log('✅ Order found:', order.order_number)
    
    // Get order items
    console.log('📦 Fetching order items...')
    const { data: orderItems, error: itemsError } = await supabaseServer
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (itemsError) {
      console.error('❌ Order items fetch error:', itemsError)
      return NextResponse.json({ 
        error: 'Failed to fetch order items', 
        details: itemsError.message 
      }, { status: 500 })
    }
    
    // Ensure orderItems is an array (even if empty)
    const safeOrderItems = orderItems || []
    console.log('✅ Order items found:', safeOrderItems.length, 'items')

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
    console.log('📄 Creating PDF document...')
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate invoice content
    console.log('🎨 Generating invoice content...')
    generateInvoicePDF(doc, order, safeOrderItems, invoiceNumber)
    
    doc.end()
    console.log('✅ PDF generation completed')
    
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
    console.error('❌ Invoice generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function generateInvoicePDF(doc: PDFKit.PDFDocument, order: any, orderItems: any[], invoiceNumber: string) {
  // Header with company logo and info
  doc.fontSize(24).fillColor('#8B0000').text('DELIVERY PRINT', 50, 50)
  doc.fontSize(12).fillColor('#000000')
  doc.text('Professional Printing & Design Services', 50, 80)
  doc.text('123 Business Avenue, San Salvador, El Salvador', 50, 95)
  doc.text('Phone: +503 2222-3333 | Email: info@deliveryprint.com', 50, 110)
  doc.text('Website: www.deliveryprint.com', 50, 125)
  
  // Invoice title and number (right side)
  doc.fontSize(28).fillColor('#8B0000').text('INVOICE', 400, 50)
  doc.fontSize(12).fillColor('#000000')
  doc.text(`Invoice #: ${invoiceNumber}`, 400, 85)
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 400, 100)
  doc.text(`Due Date: ${new Date().toLocaleDateString()}`, 400, 115)
  
  // Draw a line separator
  doc.moveTo(50, 150).lineTo(550, 150).stroke()
  doc.moveDown(3)
  
  // Order details section
  doc.y = 170
  doc.fontSize(12).text(`Order #: ${order.order_number}`, 50, doc.y)
  doc.text(`Payment Method: ${order.payment_method?.toUpperCase() || 'N/A'}`, 50, doc.y)
  doc.text(`Payment Status: ${order.payment_status || 'Paid'}`, 50, doc.y)
  doc.moveDown()
  
  // Bill to section
  doc.fontSize(14).fillColor('#8B0000').text('BILL TO:', 50, doc.y)
  doc.fontSize(12).fillColor('#000000')
  const customerName = `${order.billing_address?.firstName || ''} ${order.billing_address?.lastName || ''}`.trim()
  doc.text(customerName || order.customer_name || 'Customer', 50, doc.y)
  if (order.billing_address?.address) {
    doc.text(order.billing_address.address, 50, doc.y)
  }
  const cityStateZip = `${order.billing_address?.city || ''}, ${order.billing_address?.state || ''} ${order.billing_address?.zipCode || ''}`.trim()
  if (cityStateZip !== ', ') {
    doc.text(cityStateZip, 50, doc.y)
  }
  doc.text(order.customer_email || order.email || '', 50, doc.y)
  if (order.customer_phone || order.billing_address?.phone) {
    doc.text(order.customer_phone || order.billing_address?.phone, 50, doc.y)
  }
  doc.moveDown(2)
  
  // Items table header
  const tableTop = doc.y
  doc.fontSize(14).fillColor('#8B0000').text('ORDER ITEMS', 50, tableTop)
  doc.moveDown()
  
  // Table headers with background
  const headerY = doc.y
  doc.rect(50, headerY - 5, 500, 20).fillAndStroke('#f5f5f5', '#cccccc')
  doc.fontSize(12).fillColor('#000000')
  doc.text('Description', 55, headerY)
  doc.text('Qty', 320, headerY)
  doc.text('Unit Price', 380, headerY)
  doc.text('Total', 480, headerY)
  doc.moveDown()
  
  // Items
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach((item, index) => {
      const itemY = doc.y
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.rect(50, itemY - 3, 500, 18).fill('#f9f9f9')
      }
      
      doc.fillColor('#000000')
      doc.text(item.name || 'Unknown Item', 55, itemY, { width: 250 })
      doc.text((item.quantity || 1).toString(), 325, itemY)
      doc.text(`$${(item.price || 0).toFixed(2)}`, 385, itemY)
      doc.text(`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 485, itemY)
      doc.moveDown()
    })
  } else {
    doc.text('No items found for this order', 55, doc.y)
    doc.moveDown()
  }
  
  // Draw bottom line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
  
  // Totals section
  doc.moveDown(2)
  const totalsX = 350
  const totalsY = doc.y
  
  // Totals box
  doc.rect(totalsX - 10, totalsY - 10, 200, 80).fillAndStroke('#f8f8f8', '#cccccc')
  
  doc.fontSize(12).fillColor('#000000')
  doc.text('Subtotal:', totalsX, totalsY)
  doc.text(`$${order.subtotal.toFixed(2)}`, totalsX + 100, totalsY)
  
  doc.text('Shipping:', totalsX, totalsY + 15)
  doc.text(`$${order.shipping.toFixed(2)}`, totalsX + 100, totalsY + 15)
  
  doc.text('Tax:', totalsX, totalsY + 30)
  doc.text(`$${order.tax.toFixed(2)}`, totalsX + 100, totalsY + 30)
  
  // Total line
  doc.moveTo(totalsX, totalsY + 45).lineTo(totalsX + 180, totalsY + 45).stroke()
  doc.fontSize(14).fillColor('#8B0000')
  doc.text('TOTAL:', totalsX, totalsY + 50)
  doc.text(`$${order.total.toFixed(2)}`, totalsX + 100, totalsY + 50)
  
  // Payment info section
  doc.y = totalsY + 100
  doc.fontSize(14).fillColor('#8B0000').text('PAYMENT INFORMATION', 50, doc.y)
  doc.fontSize(12).fillColor('#000000')
  doc.text(`Method: ${order.payment_method?.toUpperCase() || 'N/A'}`, 50, doc.y)
  doc.text(`Status: ${order.payment_status || 'Paid'}`, 50, doc.y)
  if (order.payment_transaction_id) {
    doc.text(`Transaction ID: ${order.payment_transaction_id}`, 50, doc.y)
  }
  
  // Footer
  doc.y = 700 // Fixed position for footer
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
  doc.moveDown()
  doc.fontSize(12).fillColor('#8B0000')
  doc.text('Thank you for choosing Delivery Print!', { align: 'center' })
  doc.fontSize(10).fillColor('#666666')
  doc.text('For questions about this invoice, please contact us:', { align: 'center' })
  doc.text('Email: support@deliveryprint.com | Phone: +503 2222-3333', { align: 'center' })
  doc.text('Visit us at: www.deliveryprint.com', { align: 'center' })
}