import { useState, useEffect } from 'react';
import { notificationService } from './notification-service';
import { Notification } from '@/lib/models/notification';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let unsubscribeService: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                unsubscribeService = notificationService.subscribe((data) => {
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.isRead).length);
                    setLoading(false);
                }, user.uid);
            } else {
                setNotifications([]);
                setUnreadCount(0);
                setLoading(false);
                if (unsubscribeService) {
                    unsubscribeService();
                    unsubscribeService = undefined;
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeService) unsubscribeService();
        };
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
