'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function TestOrdersList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const fetchOrdersWithItems = async () => {
    setLoading(true)
    try {
      console.log('Fetching orders with items...')
      
      // Get orders with their item counts
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total,
          created_at,
          order_items (
            id,
            name,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      
      console.log('Orders data:', { ordersData, error })
      
      if (error) {
        console.error('Error fetching orders:', error)
        return
      }
      
      setOrders(ordersData || [])
      
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrdersWithItems()
  }, [])
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Orders List Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fetchOrdersWithItems} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Orders'}
          </Button>
          
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p><strong>Order:</strong> {order.order_number}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                    <p><strong>Total:</strong> ${order.total}</p>
                    <p><strong>Items:</strong> {order.order_items?.length || 0}</p>
                    <p><strong>Created:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Order
                      </Button>
                    </Link>
                    <Link href={`/test-order-debug?id=${order.id}`}>
                      <Button variant="outline" size="sm">
                        Debug
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Items:</strong></p>
                    <ul className="list-disc list-inside">
                      {order.order_items.map((item: any, index: number) => (
                        <li key={index}>
                          {item.name} (Qty: {item.quantity}, Price: ${item.price})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {orders.length === 0 && !loading && (
            <p className="text-gray-500">No orders found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}