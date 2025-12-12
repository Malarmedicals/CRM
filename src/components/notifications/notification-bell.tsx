'use client'

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/features/notifications/use-notifications';
import { NotificationItem } from './notification-item';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function NotificationBell() {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const prevUnreadCountRef = useRef(unreadCount);

    useEffect(() => {
        // Did we get a new notification?
        if (unreadCount > prevUnreadCountRef.current) {
            // Find the newest unread notification
            const newest = notifications.find(n => !n.isRead);
            if (newest) {
                toast({
                    title: newest.title,
                    description: newest.message,
                    variant: "default", // or a custom notification aesthetic
                });
            }
        }
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount, notifications, toast]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl border-border text-muted-foreground relative hover:text-foreground">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 rounded-xl shadow-xl border-border bg-popover" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                    <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
                    <div className="flex gap-2">
                        {/* Dev Tool: Generate Samples */}

                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => markAllAsRead()}
                            >
                                <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="h-[350px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                            <p className="text-xs">Loading updates...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="flex flex-col p-2 space-y-1">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={markAsRead}
                                    compact
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t border-border bg-muted/50">
                    <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-primary hover:bg-background border border-transparent hover:border-border">
                            View All Notifications
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
