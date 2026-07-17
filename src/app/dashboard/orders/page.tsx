'use client'

import { useState, useEffect } from 'react'
import { orderService } from '@/features/orders'
import type { Order } from '@/features/orders/domain/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Search, RefreshCw, Calendar, User, Package, CheckCircle, 
  Clock, Edit, Save, X, CreditCard, Trash2, Download, MoreHorizontal, FileText, Truck
} from 'lucide-react'
import { toast } from 'sonner'
import { ORDER_WORKFLOW, PAYMENT_STATUSES } from '@/config/order-workflow'
import { OrderDetailsDrawer } from '@/components/orders/order-details-drawer'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [prescriptionFilter, setPrescriptionFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  
  // Editing & Selection
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Order>>({})
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  useEffect(() => {
    loadOrders()
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
      const customerName = String(order.customerName || '').toLowerCase()
      const customerPhone = String(order.customerPhone || '').toLowerCase()
      const matchesSearch = orderId.includes(search) || customerName.includes(search) || customerPhone.includes(search)

      const matchesStatus = statusFilter === 'all' || order.deliveryStatus === statusFilter
      
      let matchesPrescription = true
      if (prescriptionFilter === 'verified') matchesPrescription = order.prescriptionVerified === true
      if (prescriptionFilter === 'pending') matchesPrescription = order.prescriptionVerified === false
      
      let matchesDate = true
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      if (dateFilter === 'today') {
        matchesDate = orderDate.toDateString() === today.toDateString()
      } else if (dateFilter === 'week') {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = orderDate >= lastWeek
      } else if (dateFilter === 'month') {
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = orderDate >= lastMonth
      }

      return matchesSearch && matchesStatus && matchesPrescription && matchesDate
    })
    
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'highest_amount') return (b.totalAmount || 0) - (a.totalAmount || 0)
      if (sortBy === 'lowest_amount') return (a.totalAmount || 0) - (b.totalAmount || 0)
      return 0
    })
    
    setFilteredOrders(filtered)
  }, [searchTerm, orders, statusFilter, prescriptionFilter, dateFilter, sortBy])

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders()
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
      const isMarkingAsDelivered = editFormData.deliveryStatus === 'delivered'
      await orderService.updateOrder(orderId, editFormData)
      await loadOrders()
      setEditingOrderId(null)

      if (isMarkingAsDelivered) {
        toast.success('Order delivered! Inventory deducted automatically.', { duration: 5000 })
      } else {
        toast.success('Order updated successfully')
      }
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
    if (selectedOrders.length > 0) {
      await handleBulkDeleteConfirm()
      return
    }
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

  const handleBulkDeleteConfirm = async () => {
    try {
      const deletePromises = selectedOrders.map(id => orderService.deleteOrder(id))
      await Promise.all(deletePromises)
      await loadOrders()
      toast.success(`${selectedOrders.length} order(s) deleted`)
      setShowDeleteDialog(false)
      setSelectedOrders([])
    } catch (error) {
      toast.error('Failed to delete orders')
    }
  }

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => checked ? [...prev, orderId] : prev.filter(id => id !== orderId))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? filteredOrders.map(o => o.id) : [])
  }
  
  // KPI Stats
  const getStatusCount = (statusId: string) => orders.filter(o => o.deliveryStatus === statusId).length
  const totalOrders = orders.length
  
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-6 md:p-8 bg-slate-50 min-h-screen">
      {/* Row 1: Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Order Management</h1>
          <p className="text-slate-500 mt-1">Manage customer orders, fulfillment, shipping, returns and payments.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedOrders.length > 0 && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedOrders.length})
            </Button>
          )}
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
        </div>
      </div>

      {/* Row 2: Professional KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         {[
           { label: 'Total Orders', count: totalOrders, icon: Package, color: 'text-slate-600' },
           { label: 'Pending', count: getStatusCount('pending'), icon: Clock, color: 'text-amber-600' },
           { label: 'Packed', count: getStatusCount('packing'), icon: Package, color: 'text-emerald-600' },
           { label: 'Shipped', count: getStatusCount('shipped'), icon: Truck, color: 'text-indigo-600' },
           { label: 'Delivered', count: getStatusCount('delivered'), icon: CheckCircle, color: 'text-green-600' },
           { label: 'Cancelled', count: getStatusCount('cancelled'), icon: X, color: 'text-red-600' },
         ].map((kpi, idx) => (
           <Card key={idx} className="p-4 shadow-sm border-slate-200 bg-white flex flex-col justify-between h-24 transition-shadow hover:shadow-md cursor-default">
             <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
             </div>
             <span className="text-2xl font-bold text-slate-900">{kpi.count}</span>
           </Card>
         ))}
      </div>

      {/* Row 3: Unified Search & Filter Toolbar */}
      <Card className="p-4 shadow-sm border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by Order ID, Name, Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(ORDER_WORKFLOW).map(status => (
                  <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prescriptionFilter} onValueChange={setPrescriptionFilter}>
              <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Prescription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prescriptions</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest_amount">Highest Amount</SelectItem>
                <SelectItem value="lowest_amount">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Row 4: Order Table */}
      <Card className="overflow-hidden shadow-sm border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Delivery</th>
                <th className="px-4 py-3 font-medium">Prescription</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No orders found matching your filters</p>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setPrescriptionFilter('all')
                        setDateFilter('all')
                      }}>Reset Filters</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isEditing = editingOrderId === order.id
                  const statusConfig = ORDER_WORKFLOW[(order.deliveryStatus || 'pending') as keyof typeof ORDER_WORKFLOW] || ORDER_WORKFLOW.pending
                  const StatusIcon = statusConfig.icon
                  const paymentConfig = order.paymentMethod === 'Cash on Delivery' ? PAYMENT_STATUSES.cod : PAYMENT_STATUSES.paid

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(c) => handleSelectOrder(order.id, c as boolean)}
                        />
                      </td>
                      
                      {/* Order ID */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono font-medium text-slate-900">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editFormData.customerName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                              className="h-8 text-xs bg-white"
                            />
                            <Input
                              value={editFormData.customerPhone || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                              {(order.customerName || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{order.customerName || 'Guest'}</div>
                              {order.customerPhone && <div className="text-xs text-slate-500">{order.customerPhone}</div>}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3 align-top max-w-[200px]">
                        {order.products && order.products.length > 0 ? (
                          <div>
                            <div className="font-medium text-slate-900 truncate" title={order.products[0].name || order.products[0].productName}>
                              {order.products[0].name || order.products[0].productName}
                            </div>
                            {order.products.length > 1 && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                +{order.products.length - 1} More Items
                              </div>
                            )}
                          </div>
                        ) : <span className="text-slate-400">No items</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-900">₹{(order.totalAmount || 0).toFixed(2)}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.products?.length || 0} items</div>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3 align-top">
                        <Badge variant="outline" className={`${paymentConfig.badgeClass} rounded-full`}>
                          {paymentConfig.label}
                        </Badge>
                      </td>

                      {/* Delivery Status */}
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <Select
                            value={editFormData.deliveryStatus || 'pending'}
                            onValueChange={(v) => setEditFormData({ ...editFormData, deliveryStatus: v as any })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ORDER_WORKFLOW).map(st => (
                                <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`${statusConfig.badgeClass} rounded-full border flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        )}
                      </td>

                      {/* Prescription */}
                      <td className="px-4 py-3 align-top">
                        {isEditing ? (
                          <Select
                            value={String(editFormData.prescriptionVerified ?? order.prescriptionVerified)}
                            onValueChange={(v) => setEditFormData({ ...editFormData, prescriptionVerified: v === 'true' })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-white w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Verified</SelectItem>
                              <SelectItem value="false">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          order.prescriptionVerified ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-top text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(order.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 group-hover:bg-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => { setSelectedOrder(order); setShowOrderDetails(true) }}>
                                <FileText className="h-4 w-4 mr-2 text-slate-500" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="h-4 w-4 mr-2 text-blue-500" /> Update Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteClick(order.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Order(s)</DialogTitle>
            <DialogDescription>
              {selectedOrders.length > 0 
                ? `Are you sure you want to permanently delete ${selectedOrders.length} selected order(s)?` 
                : 'Are you sure you want to permanently delete this order?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer 
        order={selectedOrder} 
        isOpen={showOrderDetails} 
        onClose={() => setShowOrderDetails(false)} 
      />
    </div>
  )
}
