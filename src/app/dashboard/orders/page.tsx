'use client'

import { useState, useEffect } from 'react'
import { orderService } from '@/features/orders/order-service'
import { Order } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Eye, RefreshCw, Calendar, User, Package, CheckCircle, Clock, Edit, Save, X, CreditCard, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Order>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  useEffect(() => {
    loadOrders()
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([])
      return
    }

    const search = String(searchTerm || '').toLowerCase()
    let filtered = orders.filter((order) => {
      if (!order) return false
      const orderId = String(order.id || '').toLowerCase()
      const userId = String(order.userId || '').toLowerCase()
      const customerName = String(order.customerName || '').toLowerCase()
      const customerPhone = String(order.customerPhone || '').toLowerCase()
      const matchesSearch = orderId.includes(search) || userId.includes(search) || customerName.includes(search) || customerPhone.includes(search)

      if (statusFilter === 'all') return matchesSearch
      return matchesSearch && order.deliveryStatus === statusFilter
    })
    setFilteredOrders(filtered)
  }, [searchTerm, orders, statusFilter])

  const loadOrders = async () => {
    try {
      const data = await orderService.getAllOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (order: Order) => {
    setEditingOrderId(order.id)
    setEditFormData({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      deliveryStatus: order.deliveryStatus || 'packing',
      prescriptionVerified: order.prescriptionVerified
    })
  }

  const handleSaveEdit = async (orderId: string) => {
    try {
      await orderService.updateOrder(orderId, editFormData)
      await loadOrders()
      setEditingOrderId(null)
      toast.success('Order updated successfully')
    } catch (error) {
      console.error('Failed to update order:', error)
      toast.error('Failed to update order')
    }
  }

  const handleCancelEdit = () => {
    setEditingOrderId(null)
    setEditFormData({})
  }

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    // Handle bulk delete if multiple orders selected
    if (selectedOrders.length > 0) {
      await handleBulkDeleteConfirm()
      return
    }

    // Handle single order delete
    if (!orderToDelete) return

    try {
      await orderService.deleteOrder(orderToDelete)
      await loadOrders()
      toast.success('Order deleted successfully')
      setShowDeleteDialog(false)
      setOrderToDelete(null)
    } catch (error) {
      console.error('Failed to delete order:', error)
      toast.error('Failed to delete order')
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setOrderToDelete(null)
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId])
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) return
    setShowDeleteDialog(true)
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      // Delete all selected orders
      const deletePromises = selectedOrders.map(orderId =>
        orderService.deleteOrder(orderId)
      )
      await Promise.all(deletePromises)

      await loadOrders()
      toast.success(`${selectedOrders.length} order(s) deleted successfully`)
      setShowDeleteDialog(false)
      setOrderToDelete(null)
      setSelectedOrders([])
    } catch (error) {
      console.error('Failed to delete orders:', error)
      toast.error('Failed to delete orders')
    }
  }

  const getDeliveryStatusBadge = (deliveryStatus?: string) => {
    const status = deliveryStatus || 'pending'
    const variants: Record<string, { label: string; className: string; icon: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⏰' },
      packing: { label: 'Packing', className: 'bg-orange-100 text-orange-800 border-orange-300', icon: '📦' },
      shipped: { label: 'Shipped', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🚚' },
      delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-300', icon: '✅' },
    }
    const config = variants[status] || variants.pending
    return (
      <Badge className={`${config.className} border text-xs flex items-center gap-1 w-fit`}>
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => (o.deliveryStatus || 'pending') === 'pending').length,
    shipped: orders.filter(o => o.deliveryStatus === 'shipped').length,
    delivered: orders.filter(o => o.deliveryStatus === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📦 Order Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Total Orders: <span className="font-semibold">{orders.length}</span> |
            Showing: <span className="font-semibold">{filteredOrders.length}</span>
            {selectedOrders.length > 0 && (
              <span className="ml-2 text-primary font-semibold">
                | Selected: {selectedOrders.length}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedOrders.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID, Customer ID, Name, or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All Orders <Badge className="ml-2 bg-white text-black">{statusCounts.all}</Badge>
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pending <Badge className="ml-2 bg-yellow-500">{statusCounts.pending}</Badge>
        </Button>
        <Button
          variant={statusFilter === 'shipped' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('shipped')}
        >
          Shipped <Badge className="ml-2 bg-purple-500">{statusCounts.shipped}</Badge>
        </Button>
        <Button
          variant={statusFilter === 'delivered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('delivered')}
        >
          Delivered <Badge className="ml-2 bg-green-500">{statusCounts.delivered}</Badge>
        </Button>
      </div>

      {/* Orders List - Desktop Table & Mobile Cards */}
      <div className="space-y-4">
        {/* Desktop View */}
        <Card className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr className="text-left text-xs font-semibold uppercase">
                  <th className="p-4 whitespace-nowrap w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 whitespace-nowrap">Order ID & Date</th>
                  <th className="p-4 whitespace-nowrap">Customer</th>
                  <th className="p-4 whitespace-nowrap">Products</th>
                  <th className="p-4 whitespace-nowrap">Amount</th>
                  <th className="p-4 whitespace-nowrap">Payment Method</th>
                  <th className="p-4 whitespace-nowrap">Delivery Status</th>
                  <th className="p-4 whitespace-nowrap">Prescription</th>
                  <th className="p-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const isEditing = editingOrderId === order.id

                  return (
                    <tr
                      key={order.id}
                      className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                        } ${selectedOrders.includes(order.id) ? 'bg-blue-50' : ''
                        } ${order.status === 'cancelled' ? 'opacity-60 bg-gray-50' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        />
                      </td>

                      {/* Order ID & Date */}
                      <td className="p-4">
                        <div>
                          <p className="font-mono text-xs font-semibold text-orange-600">
                            #{order.id ? order.id.substring(0, 8).toUpperCase() : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </td>

                      {/* Customer - EDITABLE */}
                      <td className="p-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Customer name"
                              value={editFormData.customerName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                              className="w-36 h-8 text-xs"
                            />
                            <Input
                              placeholder="Phone number"
                              value={editFormData.customerPhone || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                              className="w-36 h-8 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs font-medium">
                                {order.customerName || 'N/A'}
                              </p>
                              {order.customerPhone && (
                                <p className="text-xs text-muted-foreground">
                                  📞 {order.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.products && order.products.length > 0 ? (
                            order.products.slice(0, 2).map((product, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <Package className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">
                                    {product.name || product.productName || 'Unknown Product'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Qty: {product.quantity || 0}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No products</span>
                          )}
                          {order.products && order.products.length > 2 && (
                            <p className="text-xs text-muted-foreground mt-1">+{order.products.length - 2} more</p>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-4">
                        <p className="font-semibold text-sm">
                          ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                        </p>
                      </td>

                      {/* Payment Method - READ ONLY */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {order.status === 'cancelled' ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300 border text-xs w-fit">
                              ❌ Cancelled
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {order.paymentMethod || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status - EDITABLE */}
                      <td className="p-4">
                        {isEditing ? (
                          <Select
                            value={editFormData.deliveryStatus || order.deliveryStatus || 'pending'}
                            onValueChange={(value) => setEditFormData({ ...editFormData, deliveryStatus: value as any })}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏰ Pending</SelectItem>
                              <SelectItem value="packing">📦 Packing</SelectItem>
                              <SelectItem value="shipped">🚚 Shipped</SelectItem>
                              <SelectItem value="delivered">✅ Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getDeliveryStatusBadge(order.deliveryStatus)
                        )}
                      </td>

                      {/* Prescription - EDITABLE */}
                      <td className="p-4">
                        {isEditing ? (
                          <Select
                            value={editFormData.prescriptionVerified !== undefined ? String(editFormData.prescriptionVerified) : String(order.prescriptionVerified)}
                            onValueChange={(value) => setEditFormData({ ...editFormData, prescriptionVerified: value === 'true' })}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Verified</SelectItem>
                              <SelectItem value="false">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          order.prescriptionVerified ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs font-medium">Pending</span>
                            </div>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleSaveEdit(order.id)}
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderDetails(true)
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(order)}
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(order.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-orange-600 text-sm">
                      #{order.id ? order.id.substring(0, 8).toUpperCase() : 'N/A'}
                    </span>
                    {getDeliveryStatusBadge(order.deliveryStatus)}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {order.customerName || 'Guest'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
                <div className="font-bold text-base">₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</div>
              </div>

              {/* Products Preview */}
              <div className="bg-muted/30 p-2 rounded-md text-sm space-y-1">
                {order.products && order.products.length > 0 ? (
                  order.products.slice(0, 2).map((product, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>{product.name || product.productName}</span>
                      <span className="text-muted-foreground">x{product.quantity}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No products</span>
                )}
                {order.products && order.products.length > 2 && (
                  <div className="text-xs text-muted-foreground pt-1 border-t border-dashed mt-1">
                    +{order.products.length - 2} more items
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowOrderDetails(true)
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleEdit(order)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => handleDeleteClick(order.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
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
              Complete order information and product details
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Order Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono text-sm font-semibold">#{selectedOrder.id.substring(0, 8)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Payment Method
                  </p>
                  <p className="text-sm font-medium">
                    {selectedOrder.paymentMethod || 'N/A'}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Delivery</p>
                  {getDeliveryStatusBadge(selectedOrder.deliveryStatus)}
                </Card>
              </div>

              {/* Customer Info */}
              {selectedOrder.customerName && (
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-semibold">{selectedOrder.customerName}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Prescription Status */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prescription Status</span>
                  {selectedOrder.prescriptionVerified ? (
                    <Badge className="bg-green-100 text-green-800">✓ Verified</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">⏰ Pending</Badge>
                  )}
                </div>
              </Card>

              {/* Products with Category */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({selectedOrder.products?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedOrder.products?.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name || item.productName || 'Unknown Product'}</p>
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price}/unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Total */}
              <Card className="p-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order{selectedOrders.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              {selectedOrders.length > 0 ? (
                `Are you sure you want to delete ${selectedOrders.length} selected order(s)? This action cannot be undone.`
              ) : (
                'Are you sure you want to delete this order? This action cannot be undone.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

