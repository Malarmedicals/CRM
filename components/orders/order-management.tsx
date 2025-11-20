'use client'

import { useState, useEffect } from 'react'
import { orderService } from '@/lib/services/order-service'
import { Order } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Eye } from 'lucide-react'

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const orderId = order.id || ''
      const userId = order.userId || ''
      return orderId.includes(searchTerm) || userId.includes(searchTerm)
    })
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  const loadOrders = async () => {
    try {
      const data = await orderService.getAllOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    dispatched: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage all orders</p>
      </div>

      <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID or User ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left">
              <th className="pb-3 font-semibold">Order ID</th>
              <th className="pb-3 font-semibold">User ID</th>
              <th className="pb-3 font-semibold">Total Amount</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Prescription</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-4 font-mono text-xs">
                  {order.id ? `${order.id.substring(0, 8)}...` : 'N/A'}
                </td>
                <td className="py-4 font-mono text-xs">
                  {order.userId ? `${order.userId.substring(0, 8)}...` : 'N/A'}
                </td>
                <td className="py-4 font-semibold">
                  ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status || 'unknown'}
                  </span>
                </td>
                <td className="py-4">
                  {order.prescriptionVerified ? (
                    <span className="text-green-600 font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </td>
                <td className="py-4 text-xs">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-4">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}
    </div>
  )
}
