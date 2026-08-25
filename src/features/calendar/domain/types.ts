// Calendar Domain Types
import { z } from 'zod'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay: boolean
  type: string // allow compatibility with lib/models/calendar
  participants: string[]
  createdBy: string
  location?: string
  status: 'scheduled' | 'cancelled' | 'completed'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type CreateEventDTO = Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
export type UpdateEventDTO = Partial<CreateEventDTO>
