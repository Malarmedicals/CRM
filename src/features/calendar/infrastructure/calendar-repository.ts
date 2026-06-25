// Calendar Infrastructure Layer
import { supabase } from '@/lib/supabase/client'
import type { CalendarEvent, CreateEventDTO, UpdateEventDTO } from '../domain/types'

const TABLE = 'events'

function mapDataToEvent(data: any): CalendarEvent {
  return {
    id: data.id,
    ...data,
    start: new Date(data.start_time),
    end: new Date(data.end_time),
    createdAt: new Date(data.created_at || Date.now()),
    updatedAt: new Date(data.updated_at || Date.now()),
    participants: data.participants || [],
  } as CalendarEvent
}

export const calendarRepository = {
  async insert(eventData: CreateEventDTO, userId: string): Promise<string> {
    const { data, error } = await supabase.from(TABLE).insert({
      ...eventData,
      start_time: eventData.start.toISOString(),
      end_time: eventData.end.toISOString(),
      created_by: userId || 'system',
    }).select().single()

    if (error) throw error
    return data.id
  },

  async update(id: string, eventData: UpdateEventDTO): Promise<void> {
    const updatePayload: any = { ...eventData, updated_at: new Date().toISOString() }
    if (eventData.start) updatePayload.start_time = eventData.start.toISOString()
    if (eventData.end) updatePayload.end_time = eventData.end.toISOString()

    const { error } = await supabase.from(TABLE).update(updatePayload).eq('id', id)
    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },

  async getById(id: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()
    if (error || !data) return null
    return mapDataToEvent(data)
  },

  async getEvents(filters?: { start?: Date; end?: Date; type?: string; userId?: string }): Promise<CalendarEvent[]> {
    let query = supabase.from(TABLE).select('*')

    if (filters?.type) query = query.eq('type', filters.type)
    if (filters?.userId) query = query.contains('participants', [filters.userId])

    const { data, error } = await query
    if (error) throw error

    let events = data.map((d: any) => mapDataToEvent(d))

    if (filters?.start && filters?.end) {
      events = events.filter(e =>
        (e.start >= filters.start! && e.start <= filters.end!) ||
        (e.end >= filters.start! && e.end <= filters.end!) ||
        (e.start <= filters.start! && e.end >= filters.end!)
      )
    }

    return events
  },

  async checkConflicts(start: Date, end: Date, userIds: string[]): Promise<boolean> {
    const { data, error } = await supabase.from(TABLE).select('*').lt('start_time', end.toISOString())
    if (error || !data) return false

    const candidates = data.map((d: any) => mapDataToEvent(d))
    return candidates.some(event => {
      const timeOverlap = event.end > start
      const userOverlap = event.participants.some((p: any) => userIds.includes(p))
      return timeOverlap && userOverlap
    })
  },
}
