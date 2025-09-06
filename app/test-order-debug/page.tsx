'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getOrderItemsWithImages } from '@/lib/database'

export default function TestOrderDebug() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const orderId = '0d8ab5fe-ee80-4040-8076-2634d5c12706'
  
  const testOrderData = async () => {
    setLoading(true)
    try {
      console.log('Testing order:', orderId)
      
      // Test 1: Check if order exists
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      
      console.log('Order data:', { order, orderError })
      
      // Test 2: Check order items (basic)
      const { data: basicItems, error: basicError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
      
      console.log('Basic order items:', { basicItems, basicError })
      
      // Test 3: Check order items with products relation
      const { data: itemsWithProducts, error: productsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products:product_id (
            id,
            name,
            image,
            category
          )
        `)
        .eq('order_id', orderId)
      
      console.log('Items with products:', { itemsWithProducts, productsError })
      
      // Test 4: Use our enhanced function
      const enhancedItems = await getOrderItemsWithImages(orderId)
      console.log('Enhanced items:', enhancedItems)
      
      setResults({
        order: { data: order, error: orderError },
        basicItems: { data: basicItems, error: basicError },
        itemsWithProducts: { data: itemsWithProducts, error: productsError },
        enhancedItems: enhancedItems
      })
      
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Order Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Testing Order ID:</strong> {orderId}</p>
          </div>
          
          <Button onClick={testOrderData} disabled={loading}>
            {loading ? 'Testing...' : 'Test Order Data'}
          </Button>
          
          {results && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p>Check the browser console for detailed logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}