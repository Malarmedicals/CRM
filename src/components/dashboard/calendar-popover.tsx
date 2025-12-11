'use client'

import * as React from 'react'
import { format, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns'
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, ChevronRight, Filter, Shield, Loader2 } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { calendarService } from '@/features/calendar/calendar-service'
import { CalendarEvent, EventType } from '@/lib/models/calendar'
import { toast } from 'sonner'
import Link from 'next/link'

interface CalendarPopoverProps {
    className?: string
    onDateSelect?: (date: Date) => void
}

export function CalendarPopover({ className, onDateSelect }: CalendarPopoverProps) {
    const [date, setDate] = React.useState<Date>(new Date()) // Selected date in the picker
    const [currentDate] = React.useState<Date>(new Date()) // Today's date for the button label
    const [isOpen, setIsOpen] = React.useState(false)
    const [events, setEvents] = React.useState<CalendarEvent[]>([])
    const [monthEvents, setMonthEvents] = React.useState<CalendarEvent[]>([]) // Events for the whole month for indicators
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('events')

    // Quick Create State
    const [newEventTitle, setNewEventTitle] = React.useState('')
    const [newEventTime, setNewEventTime] = React.useState('09:00')
    const [newEventType, setNewEventType] = React.useState<EventType>('staff_task')

    // Filters
    const [filters, setFilters] = React.useState({
        order_pickup: true,
        delivery_slot: true,
        staff_task: true,
        other: true
    })

    // Fetch events for the selected DATE (for the list)
    React.useEffect(() => {
        if (isOpen) {
            fetchEvents(date)
        }
    }, [date, isOpen])

    // Fetch events for the MONTH (for indicators)
    React.useEffect(() => {
        if (isOpen) {
            fetchMonthEvents(date)
        }
    }, [date, isOpen]) // Re-fetch when month changes (date update triggers this if month changes)

    const fetchEvents = async (selectedDate: Date) => {
        setLoading(true)
        try {
            const start = startOfDay(selectedDate)
            const end = endOfDay(selectedDate)
            const fetchedEvents = await calendarService.getEvents({ start, end })
            setEvents(fetchedEvents)
        } catch (error) {
            console.error('Failed to fetch events', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMonthEvents = async (currentDate: Date) => {
        try {
            // Get start and end of the month for the view
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
            const fetchedEvents = await calendarService.getEvents({ start, end })
            setMonthEvents(fetchedEvents)
        } catch (error) {
            console.error("Failed to fetch month events", error)
        }
    }

    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            setDate(newDate)
            // We do NOT call onDateSelect here to keep the main calendar/button independent 
            // unless explicitly requested. 
        }
    }

    const handleCreateEvent = async () => {
        if (!newEventTitle) return

        try {
            const [hours, minutes] = newEventTime.split(':').map(Number)
            const start = new Date(date)
            start.setHours(hours, minutes)
            const end = new Date(start)
            end.setHours(hours + 1, minutes)

            await calendarService.createEvent({
                title: newEventTitle,
                start,
                end,
                type: newEventType,
                status: 'scheduled',
                allDay: false,
                participants: [],
                color: '#009688' // Default teal
            })

            toast.success('Event created successfully')
            setNewEventTitle('')
            fetchEvents(date)
            fetchMonthEvents(date) // Refresh indicators
            setActiveTab('events')
        } catch (error) {
            toast.error('Failed to create event')
        }
    }

    const filteredEvents = events.filter(e => filters[e.type as keyof typeof filters] ?? true)

    // Function to check if a day has events
    const hasEvent = (day: Date) => {
        return monthEvents.some(event => isSameDay(new Date(event.start), day))
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-start text-left font-normal rounded-xl border-slate-200 hover:bg-slate-50 hover:text-teal-700 transition-all",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-teal-600" />
                    {/* Always show current date or the 'active' date context of the dashboard, not the picker's browsing date */}
                    {format(currentDate, "MMM dd, yyyy")}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[380px] p-0 rounded-xl shadow-2xl border-slate-100 bg-white/95 backdrop-blur-md overflow-hidden"
                align="start"
                sideOffset={8}
            >
                {/* Header / Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {format(date, 'MMMM yyyy')}
                        </span>
                        <TabsList className="h-8 bg-slate-100/50">
                            <TabsTrigger value="events" className="text-xs h-6 px-2">Events</TabsTrigger>
                            <TabsTrigger value="create" className="text-xs h-6 px-2">Create</TabsTrigger>
                            <TabsTrigger value="filters" className="text-xs h-6 px-2"><Filter className="h-3 w-3" /></TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="p-3 border-b border-slate-100"
                            classNames={{
                                day_selected: "bg-teal-600 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white",
                                day_today: "bg-slate-100 text-slate-900",
                            }}
                            components={{
                                DayButton: (props) => (
                                    <div className="relative w-full h-full">
                                        <CalendarDayButton {...props} />
                                        {hasEvent(props.day.date) && (
                                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full pointer-events-none" />
                                        )}
                                    </div>
                                )
                            }}
                        />
                    </div>

                    <div className="bg-slate-50/30 min-h-[200px]">
                        <TabsContent value="events" className="m-0 p-0">
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-slate-700">
                                        Schedule for {format(date, 'MMM dd')}
                                    </h4>
                                </div>

                                <ScrollArea className="h-[180px] pr-3">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                                        </div>
                                    ) : filteredEvents.length > 0 ? (
                                        <div className="space-y-2">
                                            {filteredEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="group flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-white hover:border-teal-100 hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <div className="flex flex-col items-center pt-0.5">
                                                        <span className="text-xs font-bold text-slate-700">{format(event.start, 'HH:mm')}</span>
                                                        <div className="h-full w-0.5 bg-slate-100 mt-1 group-hover:bg-teal-100 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                                                            <Badge variant="secondary" className="text-[10px] px-1 h-5 capitalize bg-slate-100 text-slate-600">
                                                                {event.type.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        {event.description && (
                                                            <p className="text-xs text-slate-500 truncate mt-0.5">{event.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {/* PHI Masking Example */}
                                                            {event.type === 'prescription_verification' && (
                                                                <span className="flex items-center text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                    <Shield className="h-3 w-3 mr-1" /> PHI Protected
                                                                </span>
                                                            )}
                                                            <span className="flex items-center text-[10px] text-slate-400">
                                                                <Clock className="h-3 w-3 mr-1" /> {format(event.end, 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[150px] text-slate-400 text-center">
                                            <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No events for this day</p>
                                            <Button variant="link" size="sm" onClick={() => setActiveTab('create')} className="text-teal-600">
                                                Create one?
                                            </Button>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </TabsContent>

                        <TabsContent value="create" className="m-0 p-3">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="title" className="text-xs">Event Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Order Pickup #123"
                                        className="h-8 text-sm"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="time" className="text-xs">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            className="h-8 text-sm"
                                            value={newEventTime}
                                            onChange={(e) => setNewEventTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="type" className="text-xs">Type</Label>
                                        <Select value={newEventType} onValueChange={(v) => setNewEventType(v as EventType)}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="staff_task">Staff Task</SelectItem>
                                                <SelectItem value="order_pickup">Order Pickup</SelectItem>
                                                <SelectItem value="delivery_slot">Delivery</SelectItem>
                                                <SelectItem value="meeting">Meeting</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button className="w-full h-8 text-xs bg-teal-600 hover:bg-teal-700" onClick={handleCreateEvent}>
                                    <Plus className="h-3 w-3 mr-1" /> Create Event
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="filters" className="m-0 p-3">
                            <div className="space-y-3">
                                <h4 className="text-xs font-medium text-slate-500 uppercase">Filter by Type</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-pickup"
                                            checked={filters.order_pickup}
                                            onCheckedChange={(c) => setFilters(f => ({ ...f, order_pickup: !!c }))}
                                        />
                                        <label htmlFor="filter-pickup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Order Pickups
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-delivery"
                                            checked={filters.delivery_slot}
                                            onCheckedChange={(c) => setFilters(f => ({ ...f, delivery_slot: !!c }))}
                                        />
                                        <label htmlFor="filter-delivery" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Delivery Slots
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-staff"
                                            checked={filters.staff_task}
                                            onCheckedChange={(c) => setFilters(f => ({ ...f, staff_task: !!c }))}
                                        />
                                        <label htmlFor="filter-staff" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Staff Tasks
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}
