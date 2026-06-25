// Calendar Application Layer
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/core/logger/logger'
import { calendarRepository } from '../infrastructure/calendar-repository'
import type { CalendarEvent, CreateEventDTO, UpdateEventDTO } from '../domain/types'

export const calendarService = {
  async createEvent(eventData: CreateEventDTO): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()

    try {
      const hasConflict = await calendarRepository.checkConflicts(eventData.start, eventData.end, eventData.participants)
      if (hasConflict) {
        logger.warn('Potential schedule conflict detected', { start: eventData.start, end: eventData.end })
      }

      const id = await calendarRepository.insert(eventData, user?.id || 'system')
      logger.info('Calendar event created', { eventId: id })
      return id
    } catch (error: any) {
      logger.error('Failed to create calendar event', error)
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  },

  async updateEvent(id: string, eventData: UpdateEventDTO): Promise<void> {
    try {
      await calendarRepository.update(id, eventData)
      logger.info('Calendar event updated', { eventId: id })
    } catch (error: any) {
      logger.error('Failed to update calendar event', error, { eventId: id })
      throw new Error(`Failed to update calendar event: ${error.message}`)
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await calendarRepository.delete(id)
      logger.info('Calendar event deleted', { eventId: id })
    } catch (error: any) {
      logger.error('Failed to delete calendar event', error, { eventId: id })
      throw new Error(`Failed to delete calendar event: ${error.message}`)
    }
  },

  async getEventById(id: string): Promise<CalendarEvent | null> {
    try {
      return await calendarRepository.getById(id)
    } catch (error: any) {
      logger.error('Failed to fetch calendar event', error, { eventId: id })
      throw new Error(`Failed to fetch calendar event: ${error.message}`)
    }
  },

  async getEvents(filters?: { start?: Date; end?: Date; type?: string; userId?: string }): Promise<CalendarEvent[]> {
    try {
      return await calendarRepository.getEvents(filters)
    } catch (error: any) {
      logger.error('Failed to fetch calendar events', error, filters)
      throw new Error(`Failed to fetch calendar events: ${error.message}`)
    }
  },
}
