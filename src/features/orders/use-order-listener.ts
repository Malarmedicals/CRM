import { useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/lib/models/notification';

export function useOrderListener() {
    const { toast } = useToast();

    useEffect(() => {
        // Timestamp to ignore old orders loaded on init
        const startTime = new Date();

        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    const orderId = change.doc.id;
                    const createdAt = (orderData.createdAt as Timestamp)?.toDate();

                    if (createdAt && createdAt > startTime) {

                        // Check for existing notification to avoid duplicates
                        const notifQuery = query(
                            collection(db, 'notifications'),
                            where('metadata.orderId', '==', orderId)
                        );
                        const notifSnap = await getDocs(notifQuery);

                        if (notifSnap.empty) {
                            // Create Persistent Notification
                            const newNotification = {
                                title: 'New Order Received',
                                message: `Order #${orderId.slice(0, 6).toUpperCase()} placed by ${orderData.customerName || 'Customer'}. Amount: ₹${orderData.totalAmount}`,
                                type: 'order',
                                isRead: false,
                                createdAt: serverTimestamp(), // Use server timestamp
                                link: `/dashboard/orders?id=${orderId}`,
                                metadata: {
                                    orderId,
                                    amount: orderData.totalAmount
                                }
                            };

                            try {
                                await addDoc(collection(db, 'notifications'), newNotification);

                                // Optional: Global Toast via this listener
                                toast({
                                    title: "New Order",
                                    description: `Order #${orderId.slice(0, 6)} has been received.`,
                                    variant: "default",
                                });
                            } catch (err) {
                                console.error("Failed to auto-create notification", err);
                            }
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [toast]);
}
