'use client'

import DashboardCalendar from '@/components/calendar/dashboard-calendar'

export default function CalendarPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Operations Calendar</h1>
                    <p className="text-muted-foreground mt-1">Manage schedules, deliveries, and staff tasks.</p>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 h-[calc(100%-8rem)]">
                <DashboardCalendar />
            </div>
        </div>
    )
}
