'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function TestCreateOrder() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [productName, setProductName] = useState('Test T-Shirt with Custom Design')
  const [designImageUrl, setDesignImageUrl] = useState('https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Custom+Design')
  const [productImageUrl, setProductImageUrl] = useState('https://via.placeholder.com/300x300/0000FF/FFFFFF?text=Base+Product')
  const [customizedImageUrl, setCustomizedImageUrl] = useState('https://via.placeholder.com/300x300/00FF00/FFFFFF?text=Customized+Product')
  
  const createTestOrder = async () => {
    if (!user) {
      alert('Please log in first')
      return
    }
    
    setLoading(true)
    try {
      console.log('Creating test order...')
      
      // Create a test order
      const orderData = {
        order_number: `TEST-${Date.now()}`,
        user_id: user.id,
        email: user.email || 'test@example.com',
        status: 'confirmed',
        subtotal: 25.00,
        tax: 2.50,
        shipping: 5.00,
        discount: 0,
        total: 32.50,
        shipping_address: {
          name: 'Test User',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'US'
        },
        billing_address: {
          name: 'Test User',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'US'
        },
        payment_method: 'test',
        currency: 'USD'
      }
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()
      
      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`)
      }
      
      console.log('Order created:', order)
      
      // Create test order items with images
      const orderItems = [
        {
          order_id: order.id,
          product_id: '00000000-0000-0000-0000-000000000001', // Dummy product ID
          name: productName,
          quantity: 1,
          price: 25.00,
          customizations: {
            size: 'L',
            color: 'Red',
            design: 'Custom Logo'
          },
          product_image_url: productImageUrl,
          design_image_url: designImageUrl,
          customized_image_url: customizedImageUrl,
          design_file_url: 'https://via.placeholder.com/1000x1000/FF0000/FFFFFF?text=High+Res+Design',
          print_ready_file_url: 'https://via.placeholder.com/1000x1000/000000/FFFFFF?text=Print+Ready'
        },
        {
          order_id: order.id,
          product_id: '00000000-0000-0000-0000-000000000002', // Dummy product ID
          name: 'Test Mug with Photo',
          quantity: 2,
          price: 15.00,
          customizations: {
            size: 'Standard',
            photo: 'Family Photo'
          },
          product_image_url: 'https://via.placeholder.com/300x300/FFFF00/000000?text=Base+Mug',
          design_image_url: 'https://via.placeholder.com/300x300/FF00FF/FFFFFF?text=Photo+Design',
          customized_image_url: 'https://via.placeholder.com/300x300/00FFFF/000000?text=Custom+Mug'
        }
      ]
      
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()
      
      if (itemsError) {
        throw new Error(`Order items creation failed: ${itemsError.message}`)
      }
      
      console.log('Order items created:', items)
      
      setResult({
        success: true,
        order: order,
        items: items,
        message: 'Test order created successfully!'
      })
      
    } catch (error) {
      console.error('Creation error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Test Order with Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="bg-yellow-100 p-4 rounded">
              <p>Please log in to create a test order.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="designImage">Design Image URL</Label>
              <Input
                id="designImage"
                value={designImageUrl}
                onChange={(e) => setDesignImageUrl(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="productImage">Product Image URL</Label>
              <Input
                id="productImage"
                value={productImageUrl}
                onChange={(e) => setProductImageUrl(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="customizedImage">Customized Image URL</Label>
              <Input
                id="customizedImage"
                value={customizedImageUrl}
                onChange={(e) => setCustomizedImageUrl(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={createTestOrder} disabled={loading || !user}>
            {loading ? 'Creating...' : 'Create Test Order'}
          </Button>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.success ? (
                <div>
                  <p className="font-semibold text-green-800">{result.message}</p>
                  <p className="text-sm text-green-700 mt-2">
                    Order ID: {result.order.id}
                  </p>
                  <p className="text-sm text-green-700">
                    Order Number: {result.order.order_number}
                  </p>
                  <div className="mt-4 space-x-2">
                    <Link href={`/orders/${result.order.id}`}>
                      <Button variant="outline" size="sm">
                        View Order
                      </Button>
                    </Link>
                    <Link href={`/test-order-debug?id=${result.order.id}`}>
                      <Button variant="outline" size="sm">
                        Debug Order
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-800">Error creating order:</p>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p>This will create a test order with sample images to verify the image display functionality.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}