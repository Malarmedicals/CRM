import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    getDoc,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { CalendarEvent, CreateEventDTO, UpdateEventDTO } from '@/lib/models/calendar'

const COLLECTION = 'events'

export const calendarService = {
    // --- CRUD Operations ---

    async createEvent(eventData: CreateEventDTO): Promise<string> {
        try {
            // Basic conflict detection for resources/users
            const hasConflict = await this.checkConflicts(
                eventData.start,
                eventData.end,
                eventData.participants
            );

            if (hasConflict) {
                console.warn('Potential schedule conflict detected');
                // In a real app, you might throw an error or return a warning flag
            }

            const docRef = await addDoc(collection(db, COLLECTION), {
                ...eventData,
                start: Timestamp.fromDate(eventData.start),
                end: Timestamp.fromDate(eventData.end),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                createdBy: auth.currentUser?.uid || 'system',
            });
            return docRef.id;
        } catch (error: any) {
            throw new Error(`Failed to create event: ${error.message}`);
        }
    },

    async updateEvent(id: string, eventData: UpdateEventDTO): Promise<void> {
        try {
            const updatePayload: any = { ...eventData, updatedAt: Timestamp.now() };

            if (eventData.start) updatePayload.start = Timestamp.fromDate(eventData.start);
            if (eventData.end) updatePayload.end = Timestamp.fromDate(eventData.end);

            await updateDoc(doc(db, COLLECTION, id), updatePayload);
        } catch (error: any) {
            throw new Error(`Failed to update event: ${error.message}`);
        }
    },

    async deleteEvent(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, COLLECTION, id));
        } catch (error: any) {
            throw new Error(`Failed to delete event: ${error.message}`);
        }
    },

    async getEventById(id: string): Promise<CalendarEvent | null> {
        try {
            const docSnap = await getDoc(doc(db, COLLECTION, id));
            if (docSnap.exists()) {
                return this.mapDocToEvent(docSnap);
            }
            return null;
        } catch (error: any) {
            throw new Error(`Failed to get event: ${error.message}`);
        }
    },

    async getEvents(filters?: {
        start?: Date;
        end?: Date;
        type?: string;
        userId?: string;
    }): Promise<CalendarEvent[]> {
        try {
            const constraints: QueryConstraint[] = [];

            if (filters?.type) {
                constraints.push(where('type', '==', filters.type));
            }

            if (filters?.userId) {
                constraints.push(where('participants', 'array-contains', filters.userId));
            }

            // Note: Firestore range queries on multiple fields can be tricky. 
            // Usually we query by a range and then filter in memory if needed, 
            // or use a specific index. For simplicity, we'll fetch and filter for date ranges 
            // if the dataset isn't huge, or rely on client-side filtering for the view.
            // Ideally: where('start', '>=', start) AND where('start', '<=', end)

            if (filters?.start) {
                constraints.push(where('start', '>=', Timestamp.fromDate(filters.start)));
            }
            // Firestore requires the inequality filter to be on the same field first.
            // So 'end' filter might need separate handling or composite index.

            const q = query(collection(db, COLLECTION), ...constraints);
            const querySnapshot = await getDocs(q);

            const events = querySnapshot.docs.map(doc => this.mapDocToEvent(doc));

            // Client-side date filtering to handle the 'end' time overlap correctly
            if (filters?.start && filters?.end) {
                return events.filter(e =>
                    (e.start >= filters.start! && e.start <= filters.end!) ||
                    (e.end >= filters.start! && e.end <= filters.end!) ||
                    (e.start <= filters.start! && e.end >= filters.end!)
                );
            }

            return events;
        } catch (error: any) {
            throw new Error(`Failed to fetch events: ${error.message}`);
        }
    },

    // --- Logic Helpers ---

    async checkConflicts(start: Date, end: Date, userIds: string[]): Promise<boolean> {
        // Simple overlap check: Find events where (StartA < EndB) and (EndA > StartB)
        // And participant overlap exists
        try {
            // In a real app, this query needs to be optimized
            const q = query(
                collection(db, COLLECTION),
                where('start', '<', Timestamp.fromDate(end)),
                // We can't easily do 'end > start' in the same query without composite index
                // So we fetch potential overlaps based on start time and filter
            );

            const snapshot = await getDocs(q);
            const candidates = snapshot.docs.map(doc => this.mapDocToEvent(doc));

            return candidates.some(event => {
                const timeOverlap = event.end > start; // We already know event.start < end
                const userOverlap = event.participants.some(p => userIds.includes(p));
                return timeOverlap && userOverlap;
            });
        } catch (e) {
            console.error('Conflict check failed', e);
            return false;
        }
    },

    mapDocToEvent(doc: DocumentData): CalendarEvent {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            start: data.start?.toDate(),
            end: data.end?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            // Ensure arrays exist
            participants: data.participants || [],
        } as CalendarEvent;
    }
}
