import { useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function usePrescriptionListener() {
    const { toast } = useToast();

    useEffect(() => {
        // Timestamp to ignore old prescriptions loaded on init
        const startTime = new Date();

        const q = query(
            collection(db, 'prescriptions'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const prescriptionId = change.doc.id;
                    const createdAt = (data.createdAt as Timestamp)?.toDate();

                    if (createdAt && createdAt > startTime) {

                        // Check for existing notification to avoid duplicates
                        const notifQuery = query(
                            collection(db, 'notifications'),
                            where('metadata.prescriptionId', '==', prescriptionId),
                            where('type', '==', 'prescription')
                        );
                        const notifSnap = await getDocs(notifQuery);

                        if (notifSnap.empty) {
                            // Create Persistent Notification
                            const newNotification = {
                                title: 'New Prescription Received',
                                message: `New prescription uploaded by ${data.customerName || data.patientName || 'Customer'}`,
                                type: 'prescription',
                                isRead: false,
                                createdAt: serverTimestamp(),
                                link: `/dashboard/prescriptions/${prescriptionId}`,
                                metadata: {
                                    prescriptionId,
                                    userId: data.userId || ''
                                }
                            };

                            try {
                                await addDoc(collection(db, 'notifications'), newNotification);

                                // Global Toast
                                toast({
                                    title: "New Prescription",
                                    description: `New prescription from ${data.customerName || 'Customer'}`,
                                    variant: "default",
                                });
                            } catch (err) {
                                console.error("Failed to auto-create prescription notification", err);
                            }
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [toast]);
}
