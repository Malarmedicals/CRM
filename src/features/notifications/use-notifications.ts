import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        let channel: ReturnType<typeof supabase.channel> | undefined;

        const loadNotifications = async () => {
            const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
            if (!error && data) {
                setNotifications(data.map((d: any) => ({
                    id: d.id,
                    ...d,
                    isRead: d.is_read,
                    createdAt: new Date(d.created_at || Date.now())
                })));
                setUnreadCount(data.filter(d => !d.is_read).length);
            }
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            if (session) {
                loadNotifications()
                channel = supabase.channel(`notifications-${Date.now()}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                        loadNotifications()
                    })
                    .subscribe();
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            isMounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    const markAllAsRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).neq('is_read', true)
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }

    return { notifications, unreadCount, markAsRead, markAllAsRead, loading: false };
}
