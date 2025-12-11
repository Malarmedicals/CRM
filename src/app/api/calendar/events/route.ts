import { NextResponse } from 'next/server'
import { calendarService } from '@/features/calendar/calendar-service'

// GET /api/calendar/events
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    try {
        const events = await calendarService.getEvents({
            start: start ? new Date(start) : undefined,
            end: end ? new Date(end) : undefined
        })
        return NextResponse.json(events)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/calendar/events
export async function POST(request: Request) {
    try {
        const body = await request.json()
        // Validate body here...
        const id = await calendarService.createEvent({
            ...body,
            start: new Date(body.start),
            end: new Date(body.end)
        })
        return NextResponse.json({ id }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
