import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    writeBatch,
    serverTimestamp,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { Notification, NotificationType } from '@/lib/models/notification';

const COLLECTION_NAME = 'notifications';

export const notificationService = {
    // Create a new notification
    async create(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...notification,
                isRead: false,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    // Get notifications (real-time listener recommended for UI, but this is for static fetch)
    async getAll(limitCount = 50) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
            })) as Notification[];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    // Mark a single notification as read
    async markAsRead(id: string) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, { isRead: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isRead', '==', false)
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach((doc) => {
                batch.update(doc.ref, { isRead: true });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    },

    // Cleanup old notifications (older than 90 days)
    async cleanupOldNotifications() {
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const q = query(
                collection(db, COLLECTION_NAME),
                where('createdAt', '<', ninetyDaysAgo)
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            console.error('Error cleaning up old notifications:', error);
        }
    },

    // Subscribe to notifications (Real-time)
    subscribe(callback: (notifications: Notification[]) => void, limitCount = 20) {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
            })) as Notification[];
            callback(notifications);
        });
    },

    // Helper to generate sample notifications for demo
    async generateSampleNotifications() {
        const samples: Omit<Notification, 'id' | 'createdAt' | 'isRead'>[] = [
            {
                title: 'New Order Placed',
                message: 'Order #ORD-2025-001 has been placed by John Doe.',
                type: 'order',
                link: '/dashboard/orders/ORD-2025-001'
            },
            {
                title: 'Low Stock Alert',
                message: 'Paracetamol 500mg is running low (Current: 15 units).',
                type: 'inventory',
                link: '/dashboard/inventory'
            },
            {
                title: 'Prescription Uploaded',
                message: 'New prescription requires approval for Order #ORD-2025-002.',
                type: 'prescription',
                link: '/dashboard/prescriptions'
            },
            {
                title: 'System Error',
                message: 'Payment gateway API timed out. Check logs.',
                type: 'critical',
                link: '/dashboard/settings'
            },
            {
                title: 'Delivery Delayed',
                message: 'Agent Mike is delayed for Order #ORD-2025-003 due to traffic.',
                type: 'delivery',
                link: '/dashboard/delivery'
            }
        ];

        for (const sample of samples) {
            await this.create(sample);
        }
    }
};
