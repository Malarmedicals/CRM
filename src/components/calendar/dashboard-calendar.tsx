'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import { CalendarEvent, EventType } from '@/lib/models/calendar'
import { calendarService } from '@/features/calendar/calendar-service'
import { Button } from '@/components/ui/button'
import { Plus, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as MiniCalendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

const EVENT_COLORS: Record<EventType, string> = {
    order_pickup: '#009688', // Teal
    delivery_slot: '#1E88E5', // Blue
    prescription_verification: '#FF7043', // Coral
    staff_task: '#78909C', // Grey
    refill_reminder: '#8E24AA', // Purple
    meeting: '#FBC02D', // Yellow
    other: '#546E7A'
}

export default function DashboardCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [view, setView] = useState<View>(Views.MONTH)
    const [date, setDate] = useState(new Date())
    const [loading, setLoading] = useState(true)

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    // Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        title: '',
        type: 'staff_task',
        description: '',
        allDay: false
    })

    const onDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate)
            setIsDatePickerOpen(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [date, view]) // Refetch when date range changes significantly if we implemented server-side range queries

    const [error, setError] = useState<string | null>(null)

    // ...

    const fetchEvents = async () => {
        setLoading(true)
        setError(null)
        try {
            // In a real app, calculate start/end of current view to optimize fetch
            const fetchedEvents = await calendarService.getEvents()
            setEvents(fetchedEvents)
        } catch (error: any) {
            console.error(error)
            if (error.message.includes('Missing or insufficient permissions')) {
                setError('Permission denied. Please ensure Firestore rules are deployed: firebase deploy --only firestore:rules')
            } else {
                toast.error('Failed to load events')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setSelectedSlot(slotInfo)
        setFormData({
            ...formData,
            start: slotInfo.start,
            end: slotInfo.end,
            allDay: false // slotInfo.action === 'doubleClick' ? true : false (simplified)
        })
        setIsCreateOpen(true)
    }

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsDetailOpen(true)
    }

    const handleCreateEvent = async () => {
        if (!formData.title || !formData.start || !formData.end) {
            toast.error('Please fill in required fields')
            return
        }

        try {
            await calendarService.createEvent({
                title: formData.title,
                start: formData.start,
                end: formData.end,
                type: formData.type as EventType || 'other',
                description: formData.description,
                allDay: formData.allDay || false,
                status: 'scheduled',
                participants: [], // Add current user logic here
                color: EVENT_COLORS[formData.type as EventType] || EVENT_COLORS.other
            })
            toast.success('Event created successfully')
            setIsCreateOpen(false)
            fetchEvents()
            resetForm()
        } catch (error) {
            toast.error('Failed to create event')
        }
    }

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return
        try {
            await calendarService.deleteEvent(selectedEvent.id)
            toast.success('Event deleted')
            setIsDetailOpen(false)
            fetchEvents()
        } catch (error) {
            toast.error('Failed to delete event')
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            type: 'staff_task',
            description: '',
            allDay: false
        })
        setSelectedSlot(null)
    }

    const eventStyleGetter = (event: CalendarEvent) => {
        const backgroundColor = EVENT_COLORS[event.type] || EVENT_COLORS.other
        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block'
            }
        }
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDate(moment(date).subtract(1, view === 'month' ? 'month' : 'week').toDate())}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setDate(new Date())}
                            className="text-sm font-medium px-3"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDate(moment(date).add(1, view === 'month' ? 'month' : 'week').toDate())}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="text-xl font-bold text-slate-800 hover:bg-slate-50 px-2 h-auto"
                            >
                                <CalendarIcon className="mr-2 h-5 w-5 text-teal-600" />
                                {moment(date).format('MMMM YYYY')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl"
                            align="start"
                            sideOffset={8}
                        >
                            <MiniCalendar
                                mode="single"
                                selected={date}
                                onSelect={onDateSelect}
                                initialFocus
                                className="p-3"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={view} onValueChange={(v) => setView(v as View)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={Views.MONTH}>Month</SelectItem>
                            <SelectItem value={Views.WEEK}>Week</SelectItem>
                            <SelectItem value={Views.DAY}>Day</SelectItem>
                            <SelectItem value={Views.AGENDA}>Agenda</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={() => setIsCreateOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        New Event
                    </Button>
                </div>
            </div>

            {/* Main Calendar View */}
            <Card className="flex-1 p-4 border-none shadow-sm bg-white min-h-[600px]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    className="rounded-lg"
                />
            </Card>

            {/* Create Event Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Delivery Pickup"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val as EventType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="order_pickup">Order Pickup</SelectItem>
                                        <SelectItem value="delivery_slot">Delivery Slot</SelectItem>
                                        <SelectItem value="staff_task">Staff Task</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <div className="flex items-center h-10 px-3 border rounded-md bg-slate-50 text-sm text-slate-500">
                                    {formData.start ? moment(formData.start).format('MMM D, YYYY') : 'Select date'}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Textarea
                                id="desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add details..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateEvent} className="bg-teal-600 hover:bg-teal-700">Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Event Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                                {moment(selectedEvent?.start).format('MMMM D, YYYY h:mm A')} -
                                {moment(selectedEvent?.end).format('h:mm A')}
                            </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            <p className="font-medium text-slate-700 mb-1">Description</p>
                            <p className="text-slate-600">{selectedEvent?.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                                {selectedEvent?.type.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                                {selectedEvent?.status}
                            </span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="destructive" onClick={handleDeleteEvent}>Delete</Button>
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
