export type NotificationType =
    | 'order'
    | 'prescription'
    | 'inventory'
    | 'critical'
    | 'delivery'
    | 'subscription'
    | 'general';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
    link?: string; // URL to redirect to (e.g., /dashboard/orders/123)
    metadata?: Record<string, any>; // Extra data like orderId, productId
}

export const NOTIFICATION_TYPES: Record<NotificationType, { label: string; color: string; icon: string }> = {
    order: { label: 'Order', color: 'bg-blue-100 text-blue-700', icon: 'ShoppingBag' },
    prescription: { label: 'Prescription', color: 'bg-purple-100 text-purple-700', icon: 'FileText' },
    inventory: { label: 'Inventory', color: 'bg-amber-100 text-amber-700', icon: 'Package' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: 'AlertTriangle' },
    delivery: { label: 'Delivery', color: 'bg-teal-100 text-teal-700', icon: 'Truck' },
    subscription: { label: 'Subscription', color: 'bg-indigo-100 text-indigo-700', icon: 'Repeat' },
    general: { label: 'General', color: 'bg-slate-100 text-slate-700', icon: 'Bell' },
};
