'use client'

import { useState } from 'react';
import { useNotifications } from '@/features/notifications/use-notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Filter, Search, Trash2, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationType, NOTIFICATION_TYPES } from '@/lib/models/notification';

export default function NotificationsPage() {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredNotifications = notifications.filter(n => {
        const matchesType = filterType === 'all' || n.type === filterType;
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    <p className="text-slate-500">Stay updated with all CRM activities.</p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button onClick={() => markAllAsRead()} className="bg-teal-600 hover:bg-teal-700 text-white">
                            <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search notifications..."
                                className="pl-9 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={(v) => setFilterType(v as NotificationType | 'all')}>
                            <SelectTrigger className="w-[140px] bg-white">
                                <SelectValue placeholder="Filter by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-slate-500">
                        Showing {filteredNotifications.length} notifications
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <div key={notification.id} className="p-2 hover:bg-slate-50 transition-colors">
                                <NotificationItem
                                    notification={notification}
                                    onRead={markAsRead}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No notifications found</h3>
                            <p className="text-sm max-w-xs text-center mt-1">
                                We couldn't find any notifications matching your current filters.
                            </p>
                            {(filterType !== 'all' || searchQuery) && (
                                <Button variant="link" onClick={() => { setFilterType('all'); setSearchQuery(''); }} className="mt-2 text-teal-600">
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
