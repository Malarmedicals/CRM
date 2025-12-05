'use client'

import { useState, useEffect } from 'react'
import { orderService } from '@/lib/services/order-service'
import { Order } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Eye, Package, Calendar, User, IndianRupee, CheckCircle, XCircle } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([])
      return
    }
    
    const search = String(searchTerm || '')
    const filtered = orders.filter((order) => {
      if (!order) return false
      const orderId = String(order.id || '')
      const userId = String(order.userId || '')
      return orderId.includes(search) || userId.includes(search)
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
                  ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => {
                      setSelectedOrder(order)
                      setShowOrderDetails(true)
                    }}
                  >
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

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View complete order information and product details
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Order ID</span>
                  </div>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">User ID</span>
                  </div>
                  <p className="font-mono text-sm">{selectedOrder.userId}</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Order Date</span>
                  </div>
                  <p className="text-sm">
                    {selectedOrder.createdAt 
                      ? new Date(selectedOrder.createdAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    statusColors[selectedOrder.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.status || 'unknown'}
                  </span>
                </Card>
              </div>

              {/* Prescription Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prescription Status</span>
                  {selectedOrder.prescriptionVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Products List */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Ordered Products ({selectedOrder.products?.length || 0})
                </h3>
                
                {selectedOrder.products && selectedOrder.products.length > 0 ? (
                  <div className="space-y-3">
                    <div className="border-b border-border pb-2">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-6">Product Name</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                    </div>
                    
                    {selectedOrder.products.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 py-3 border-b border-border last:border-0">
                        <div className="col-span-6">
                          <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {item.productId}
                          </p>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                            {item.quantity || 0}
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-sm">₹{(item.price || 0).toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="font-semibold">
                            ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No products found in this order</p>
                )}
              </Card>

              {/* Order Summary */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">Order Total</span>
                  </div>
                  <span className="text-2xl font-bold">
                    ₹{(selectedOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </Card>

              {/* Tracking Info */}
              {selectedOrder.dispatchTracking && (
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-2">Tracking Information</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.dispatchTracking}</p>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
