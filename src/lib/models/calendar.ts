
export type EventType = 'order_pickup' | 'delivery_slot' | 'prescription_verification' | 'staff_task' | 'refill_reminder' | 'meeting' | 'other';

export type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'deferred';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    interval: number; // e.g., every 2 weeks
    endDate?: Date;
    count?: number; // e.g., 10 occurrences
    daysOfWeek?: number[]; // 0-6 for weekly
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    status: EventStatus;
    location?: string;

    // Recurrence
    recurrence?: RecurrenceRule;
    isRecurringInstance?: boolean;
    seriesId?: string; // Links instances to the main series

    // Participants & Relations
    participants: string[]; // User IDs
    relatedEntityId?: string; // Order ID, Prescription ID, etc.
    relatedEntityType?: 'order' | 'prescription' | 'customer' | 'inventory';

    // Metadata
    color?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEventDTO extends Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
    createdBy?: string;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> { }
