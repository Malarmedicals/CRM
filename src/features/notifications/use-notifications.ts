import { useState, useEffect } from 'react';
import { notificationService } from './notification-service';
import { Notification } from '@/lib/models/notification';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsubscribe = notificationService.subscribe((data) => {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await notificationService.markAsRead(id);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await notificationService.markAllAsRead();
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead
    };
}
