import { Order } from '@/features/orders/domain/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ORDER_WORKFLOW, PAYMENT_STATUSES } from '@/config/order-workflow'
import { User, CreditCard, Package, CheckCircle, Clock, Calendar, Phone, Mail } from 'lucide-react'
import { OrderStockHistory } from '@/components/orders/order-stock-history'

interface OrderDetailsDrawerProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsDrawer({ order, isOpen, onClose }: OrderDetailsDrawerProps) {
  if (!order) return null

  // Ensure type matches OrderWorkflowStatus by explicitly typing or asserting
  const statusKey = (order.deliveryStatus || 'pending') as keyof typeof ORDER_WORKFLOW
  const workflowStatus = ORDER_WORKFLOW[statusKey] || ORDER_WORKFLOW.pending
  const WorkflowIcon = workflowStatus.icon

  const paymentStatus = order.paymentMethod === 'Cash on Delivery' ? PAYMENT_STATUSES.cod : PAYMENT_STATUSES.paid

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                Order #{order.id.substring(0, 8).toUpperCase()}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1.5 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </SheetDescription>
            </div>
            <Badge className={workflowStatus.badgeClass + ' border px-3 py-1 text-sm rounded-full'}>
              <WorkflowIcon className="h-4 w-4 mr-1.5" />
              {workflowStatus.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-12">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-sm border-slate-200">
               <div className="flex items-center gap-2 mb-3 text-slate-500">
                 <User className="h-4 w-4" />
                 <span className="text-sm font-medium">Customer</span>
               </div>
               <p className="font-semibold text-slate-900 text-lg">{order.customerName || 'Guest'}</p>
               {order.customerPhone && (
                 <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                   <Phone className="h-3.5 w-3.5" />
                   {order.customerPhone}
                 </p>
               )}
            </Card>

            <Card className="p-4 shadow-sm border-slate-200">
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2 text-slate-500">
                   <CreditCard className="h-4 w-4" />
                   <span className="text-sm font-medium">Payment</span>
                 </div>
                 <Badge variant="outline" className={paymentStatus.badgeClass}>{paymentStatus.label}</Badge>
               </div>
               <p className="font-bold text-2xl text-slate-900">₹{(order.totalAmount || 0).toFixed(2)}</p>
               <p className="text-xs text-slate-500 mt-1">{order.paymentMethod || 'Online Payment'}</p>
            </Card>
          </div>

          <Card className="p-4 shadow-sm border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2 text-slate-700">
                <CheckCircle className="h-4 w-4 text-slate-400" />
                Prescription Required
              </span>
              {order.prescriptionVerified ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border hover:bg-emerald-100">Verified</Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 border hover:bg-amber-100">Pending</Badge>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden shadow-sm border-slate-200">
            <div className="bg-slate-50 p-3 border-b border-slate-200 font-medium text-sm flex items-center gap-2 text-slate-700">
               <Package className="h-4 w-4" />
               Order Items ({order.products?.length || 0})
            </div>
            <div className="divide-y divide-slate-100">
              {order.products?.map((item, index) => (
                <div key={index} className="p-4 flex items-start justify-between hover:bg-slate-50/50">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name || item.productName || 'Unknown Product'}</p>
                    <p className="text-sm text-slate-500 mt-0.5">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">₹{item.price}/each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
              <span className="font-medium text-slate-700">Total Amount</span>
              <span className="font-bold text-xl text-slate-900">₹{(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </Card>

          {/* Timeline / Stock History */}
          {order.deliveryStatus === 'delivered' && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-slate-900">Operational History</h3>
              <OrderStockHistory orderId={order.id} />
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
