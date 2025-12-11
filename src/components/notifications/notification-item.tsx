import { formatDistanceToNow } from 'date-fns';
import { Notification, NOTIFICATION_TYPES } from '@/lib/models/notification';
import { cn } from '@/lib/utils';
import { ShoppingBag, FileText, Package, AlertTriangle, Truck, Repeat, Bell, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface NotificationItemProps {
    notification: Notification;
    onRead?: (id: string) => void;
    compact?: boolean;
}

const IconMap = {
    ShoppingBag,
    FileText,
    Package,
    AlertTriangle,
    Truck,
    Repeat,
    Bell
};

export function NotificationItem({ notification, onRead, compact = false }: NotificationItemProps) {
    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.general;
    const Icon = IconMap[typeConfig.icon as keyof typeof IconMap] || Bell;

    const handleClick = () => {
        if (!notification.isRead && onRead) {
            onRead(notification.id);
        }
    };

    const Content = (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg transition-colors relative group cursor-pointer",
                notification.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/50 hover:bg-blue-50",
                compact ? "items-start" : "items-center"
            )}
            onClick={handleClick}
        >
            <div className={cn("p-2 rounded-full shrink-0", typeConfig.color)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className={cn("text-sm font-medium truncate", notification.isRead ? "text-slate-700" : "text-slate-900")}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                </div>
                <p className={cn("text-xs line-clamp-2 mt-0.5", notification.isRead ? "text-slate-500" : "text-slate-600")}>
                    {notification.message}
                </p>
            </div>
            {!notification.isRead && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
        </div>
    );

    if (notification.link) {
        return <Link href={notification.link} onClick={handleClick}>{Content}</Link>;
    }

    return Content;
}
