# 📄 **PRINT RECEIPT & DOWNLOAD INVOICE IMPLEMENTATION GUIDE**

## 🎯 **Overview**

This guide provides complete implementation instructions for activating the **Print Receipt** and **Download Invoice** functionality in the order confirmation page.

## 🏗️ **Architecture Overview**

### **Current State:**
- ❌ Print Receipt button exists but has no functionality
- ❌ Download Invoice button exists but has no functionality
- ✅ Invoice generation exists in `/orders/[id]/page.tsx` but not in confirmation page

### **Target State:**
- ✅ Print Receipt generates and prints a customer receipt
- ✅ Download Invoice generates and downloads a PDF invoice
- ✅ Both functions work from order confirmation page
- ✅ Proper error handling and loading states

---

## 🔧 **STEP 1: Create API Endpoints**

### **1.1 Create Receipt API Endpoint**

**File:** `app/api/orders/[id]/receipt/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOrderById, getOrderItems } from '@/lib/database'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    
    // Get order and items
    const order = await getOrderById(orderId)
    const orderItems = await getOrderItems(orderId)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate receipt content
    generateReceiptPDF(doc, order, orderItems)
    
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
  doc.text(`Customer: ${order.billing_address?.firstName} ${order.billing_address?.lastName}`, 50, doc.y)
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
  orderItems.forEach((item) => {
    const itemY = doc.y
    doc.text(item.name, 50, itemY)
    doc.text(item.quantity.toString(), 300, itemY)
    doc.text(`$${item.price.toFixed(2)}`, 400, itemY)
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 500, itemY)
    doc.moveDown()
  })
  
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
```

### **1.2 Create/Update Invoice API Endpoint**

**File:** `app/api/orders/[id]/invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getOrderById, getOrderItems } from '@/lib/database'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id
    
    // Get order and items
    const order = await getOrderById(orderId)
    const orderItems = await getOrderItems(orderId)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice_number
    if (!invoiceNumber) {
      invoiceNumber = `INV-${Date.now()}`
      
      // Update order with invoice number
      await supabase
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', orderId)
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    
    // Generate invoice content
    generateInvoicePDF(doc, order, orderItems, invoiceNumber)
    
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
  doc.text(`${order.billing_address?.firstName} ${order.billing_address?.lastName}`, 50, doc.y)
  doc.text(order.billing_address?.address || '', 50, doc.y)
  doc.text(`${order.billing_address?.city}, ${order.billing_address?.state} ${order.billing_address?.zipCode}`, 50, doc.y)
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
  orderItems.forEach((item) => {
    const itemY = doc.y
    doc.text(item.name, 50, itemY, { width: 240 })
    doc.text(item.quantity.toString(), 300, itemY)
    doc.text(`$${item.price.toFixed(2)}`, 380, itemY)
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 480, itemY)
    doc.moveDown()
  })
  
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
```

---

## 🔧 **STEP 2: Install Required Dependencies**

### **2.1 Install PDF Generation Library**

```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

### **2.2 Alternative: Using jsPDF (Lighter Option)**

```bash
npm install jspdf
npm install --save-dev @types/jspdf
```

---

## 🔧 **STEP 3: Update Order Confirmation Page**

### **3.1 Add Functionality to Confirmation Page**

**File:** `app/orders/[id]/confirmation/page.tsx`

**Add these imports:**
```typescript
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
```

**Add these state variables:**
```typescript
const [generatingReceipt, setGeneratingReceipt] = useState(false)
const [generatingInvoice, setGeneratingInvoice] = useState(false)
const { toast } = useToast()
```

**Add these functions:**
```typescript
const handlePrintReceipt = async () => {
  if (!order || !user) return

  setGeneratingReceipt(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to generate receipt.",
        variant: "destructive",
      })
      return
    }

    const response = await fetch(`/api/orders/${id}/receipt`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to generate receipt')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Receipt generated successfully",
    })
  } catch (error) {
    console.error('Receipt generation error:', error)
    toast({
      title: "Error",
      description: "Failed to generate receipt",
      variant: "destructive",
    })
  } finally {
    setGeneratingReceipt(false)
  }
}

const handleDownloadInvoice = async () => {
  if (!order || !user) return

  setGeneratingInvoice(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to generate invoice.",
        variant: "destructive",
      })
      return
    }

    const response = await fetch(`/api/orders/${id}/invoice`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to generate invoice')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `Invoice_${order.order_number || id.slice(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Success",
      description: "Invoice downloaded successfully",
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    toast({
      title: "Error",
      description: "Failed to generate invoice",
      variant: "destructive",
    })
  } finally {
    setGeneratingInvoice(false)
  }
}
```

**Update the buttons:**
```typescript
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button 
    variant="outline" 
    className="flex-1"
    onClick={handlePrintReceipt}
    disabled={generatingReceipt}
  >
    {generatingReceipt ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Printer className="mr-2 h-4 w-4" />
    )}
    {generatingReceipt ? 'Generating...' : 'Print Receipt'}
  </Button>
  <Button 
    variant="outline" 
    className="flex-1"
    onClick={handleDownloadInvoice}
    disabled={generatingInvoice}
  >
    {generatingInvoice ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <FileText className="mr-2 h-4 w-4" />
    )}
    {generatingInvoice ? 'Generating...' : 'Download Invoice'}
  </Button>
  <Button asChild className="flex-1 bg-[#8B0000] hover:bg-[#6B0000]">
    <Link href="/orders">
      View All Orders
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </Button>
</div>
```

---

## 🔧 **STEP 4: Database Schema Updates (Optional)**

### **4.1 Add Invoice Number Column**

**File:** `supabase/migrations/add_invoice_number.sql`

```sql
-- Add invoice_number column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);

-- Add constraint to ensure invoice numbers are unique
ALTER TABLE orders 
ADD CONSTRAINT unique_invoice_number UNIQUE (invoice_number);
```

---

## 🔧 **STEP 5: Error Handling & Security**

### **5.1 Add Authentication Middleware**

**File:** `middleware/auth-check.ts`

```typescript
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function verifyOrderAccess(request: NextRequest, orderId: string) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    throw new Error('No authorization header')
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid authentication')
  }
  
  // Check if user owns the order or is admin
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()
  
  if (!order || (order.user_id !== user.id && user.user_metadata?.role !== 'admin')) {
    throw new Error('Access denied')
  }
  
  return user
}
```

### **5.2 Add Rate Limiting (Optional)**

```typescript
// Add to API routes
const rateLimitMap = new Map()

function rateLimit(ip: string, limit: number = 10, window: number = 60000) {
  const now = Date.now()
  const userRequests = rateLimitMap.get(ip) || []
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter((time: number) => now - time < window)
  
  if (validRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  validRequests.push(now)
  rateLimitMap.set(ip, validRequests)
}
```

---

## 🔧 **STEP 6: Testing Instructions**

### **6.1 Manual Testing Checklist**

**Print Receipt:**
- [ ] Click "Print Receipt" button
- [ ] Verify loading state shows
- [ ] Verify PDF opens in new window
- [ ] Verify print dialog appears
- [ ] Check PDF content is correct
- [ ] Test with different order types
- [ ] Test error handling (invalid order ID)

**Download Invoice:**
- [ ] Click "Download Invoice" button
- [ ] Verify loading state shows
- [ ] Verify PDF downloads automatically
- [ ] Check filename format
- [ ] Verify PDF content is correct
- [ ] Test invoice number generation
- [ ] Test with existing invoice numbers

### **6.2 API Testing**

```bash
# Test receipt endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/orders/ORDER_ID/receipt

# Test invoice endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/orders/ORDER_ID/invoice
```

---

## 🔧 **STEP 7: Deployment Considerations**

### **7.1 Environment Variables**

```bash
# Add to .env.local
PDF_GENERATION_ENABLED=true
MAX_PDF_SIZE_MB=10
PDF_TIMEOUT_MS=30000
```

### **7.2 Performance Optimization**

1. **PDF Caching:** Cache generated PDFs for 24 hours
2. **Async Generation:** Use background jobs for large orders
3. **CDN Storage:** Store PDFs in cloud storage for faster access

### **7.3 Monitoring**

```typescript
// Add logging for PDF generation
console.log(`PDF generated: ${type} for order ${orderId} in ${duration}ms`)

// Add error tracking
if (error) {
  console.error(`PDF generation failed: ${error.message}`, {
    orderId,
    type,
    userId: user?.id
  })
}
```

---

## ✅ **STEP 8: Verification & Go-Live**

### **8.1 Pre-Launch Checklist**

- [ ] All dependencies installed
- [ ] API endpoints created and tested
- [ ] Frontend functionality implemented
- [ ] Error handling in place
- [ ] Authentication working
- [ ] PDF generation working
- [ ] Database migrations applied
- [ ] Rate limiting configured
- [ ] Monitoring in place

### **8.2 Success Criteria**

- ✅ Users can print receipts from order confirmation
- ✅ Users can download invoices as PDF
- ✅ PDFs contain all necessary order information
- ✅ Proper error handling and user feedback
- ✅ Loading states during generation
- ✅ Authentication and authorization working
- ✅ Performance is acceptable (< 5 seconds)

---

## 🚀 **Quick Start Commands**

```bash
# 1. Install dependencies
npm install pdfkit @types/pdfkit

# 2. Create API directories
mkdir -p app/api/orders/[id]/receipt
mkdir -p app/api/orders/[id]/invoice

# 3. Copy the API route files from this guide

# 4. Update the confirmation page with the new functions

# 5. Test the functionality
npm run dev
```

**This implementation provides a complete, production-ready solution for Print Receipt and Download Invoice functionality with proper error handling, authentication, and user experience.**