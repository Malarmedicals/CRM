import { Clock, CheckCircle, Package, Truck, Home, XCircle, RefreshCcw, DollarSign, RotateCcw } from 'lucide-react'

export const ORDER_WORKFLOW = {
  pending: {
    id: 'pending',
    label: 'Pending',
    color: 'amber',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    id: 'confirmed',
    label: 'Confirmed',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
  packing: {
    id: 'packing',
    label: 'Packed',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Package,
  },
  shipped: {
    id: 'shipped',
    label: 'Shipped',
    color: 'indigo',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Truck,
  },
  out_for_delivery: {
    id: 'out_for_delivery',
    label: 'Out For Delivery',
    color: 'indigo',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Home,
  },
  delivered: {
    id: 'delivered',
    label: 'Delivered',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
  },
  cancelled: {
    id: 'cancelled',
    label: 'Cancelled',
    color: 'red',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  returned: {
    id: 'returned',
    label: 'Returned',
    color: 'orange',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: RotateCcw,
  },
  refunded: {
    id: 'refunded',
    label: 'Refunded',
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: DollarSign,
  }
} as const;

export type OrderWorkflowStatus = keyof typeof ORDER_WORKFLOW;

export const PAYMENT_STATUSES = {
  paid: { label: 'Paid', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pending: { label: 'Pending', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  failed: { label: 'Failed', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  refunded: { label: 'Refunded', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' },
  cod: { label: 'Cash on Delivery', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
} as const;
