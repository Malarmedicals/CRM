'use client'

import DashboardCalendar from '@/components/calendar/dashboard-calendar'

export default function CalendarPage() {
    return (
        <div className="h-[calc(100vh-4rem)] p-6 bg-[#F7F9FB]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Operations Calendar</h1>
                    <p className="text-slate-500">Manage schedules, deliveries, and staff tasks.</p>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 h-[calc(100%-5rem)]">
                <DashboardCalendar />
            </div>
        </div>
    )
}
