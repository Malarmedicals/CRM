import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Prescription, PrescriptionItem } from '@/lib/models/types'
import { notificationService } from '@/features/notifications/notification-service'

export const prescriptionService = {
    // Create new prescription (Intake)
    async createPrescription(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'prescriptions'), {
                ...data,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            })

            // Notify Admin
            await notificationService.create({
                title: 'New Prescription Received',
                message: `New prescription uploaded by ${data.customerName || 'Customer'}`,
                type: 'prescription',
                link: `/dashboard/prescriptions/${docRef.id}`,
                metadata: { prescriptionId: docRef.id }
            } as any)

            return docRef.id
        } catch (error: any) {
            throw new Error(`Failed to create prescription: ${error.message}`)
        }
    },

    // Get all prescriptions (with optional status filter)
    async getAllPrescriptions(status?: Prescription['status']): Promise<Prescription[]> {
        try {
            let q = query(
                collection(db, 'prescriptions'),
                orderBy('createdAt', 'desc')
            )

            if (status) {
                q = query(
                    collection(db, 'prescriptions'),
                    where('status', '==', status),
                    orderBy('createdAt', 'desc')
                )
            }

            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                prescriptionDate: doc.data().prescriptionDate?.toDate(),
            } as Prescription))
        } catch (error: any) {
            console.error('Error fetching prescriptions:', error)
            // Fallback for missing indexes or other query errors
            if (error.code === 'failed-precondition') {
                throw new Error('Requires Firestore index. Please check console.')
            }
            throw new Error(`Failed to fetch prescriptions: ${error.message}`)
        }
    },

    // Get single prescription by ID
    async getPrescriptionById(id: string): Promise<Prescription | null> {
        try {
            const docRef = doc(db, 'prescriptions', id)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const data = docSnap.data()
                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    prescriptionDate: data.prescriptionDate?.toDate(),
                } as Prescription
            }
            return null
        } catch (error: any) {
            throw new Error(`Failed to fetch prescription: ${error.message}`)
        }
    },

    // Update prescription status and details
    async updatePrescription(
        id: string,
        data: Partial<Prescription>,
        userId?: string
    ): Promise<void> {
        try {
            const updateData = {
                ...data,
                updatedAt: serverTimestamp(),
                ...(userId ? { pharmacistId: userId } : {}), // Track who updated it if provided
            }
            await updateDoc(doc(db, 'prescriptions', id), updateData)
        } catch (error: any) {
            throw new Error(`Failed to update prescription: ${error.message}`)
        }
    },

    // Verify and Approve Prescription
    async approvePrescription(
        id: string,
        medicines: PrescriptionItem[],
        pharmacistId: string,
        notes?: string
    ): Promise<void> {
        try {
            await updateDoc(doc(db, 'prescriptions', id), {
                status: 'approved',
                prescribedMedicines: medicines,
                pharmacistId,
                verificationNotes: notes,
                updatedAt: serverTimestamp(),
            })

            // Notify Customer (Need to fetch prescription to get userId first, but optimizing for now) 
            // We assume the caller might want to do this, or we do a quick fetch, or we just rely on Admin seeing it.
            // But strictly, this notifies the "System" that it's approved. 
            // Ideally we need the userId to notify the specific user. 
            // For now, let's create a generic notification that will show up in the Admin Log.

            await notificationService.create({
                title: 'Prescription Approved',
                message: `Prescription #${id.slice(0, 8)} has been approved.`,
                type: 'prescription',
                link: `/dashboard/prescriptions/${id}`,
                metadata: { prescriptionId: id, status: 'approved' }
            } as any)

        } catch (error: any) {
            throw new Error(`Failed to approve prescription: ${error.message}`)
        }
    },

    // Create Order from Approved Prescription
    async createOrderFromPrescription(
        prescription: Prescription,
        medicines: PrescriptionItem[]
    ): Promise<string> {
        try {
            // Calculate Total
            const totalAmount = medicines.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0)

            // Map to Order Items
            const orderItems = medicines.map(item => ({
                productId: item.productId || 'manual',
                name: item.medicineName,
                productName: item.productName || item.medicineName,
                quantity: item.quantity,
                price: item.price || 0,
                // image: item.image // If available
            }))

            // Create Order
            const orderData = {
                userId: prescription.userId,
                customerName: prescription.customerName,
                customerPhone: prescription.customerPhone,
                products: orderItems,
                totalAmount,
                status: 'pending', // Pending Payment from Customer
                isNew: true,
                paymentMethod: 'Pending Link', // Special status for prescription orders requiring payment link
                deliveryStatus: 'pending',
                prescriptionVerified: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }

            const orderRef = await addDoc(collection(db, 'orders'), orderData)

            // Update Prescription with Order ID and Status
            await updateDoc(doc(db, 'prescriptions', prescription.id), {
                orderId: orderRef.id,
                status: 'ordered', // Mark as converted to order
                updatedAt: serverTimestamp(),
            })

            return orderRef.id
        } catch (error: any) {
            throw new Error(`Failed to create order from prescription: ${error.message}`)
        }
    },

    // Reject Prescription
    async rejectPrescription(
        id: string,
        reason: string,
        pharmacistId: string
    ): Promise<void> {
        try {
            if (!reason) throw new Error('Rejection reason is required')

            await updateDoc(doc(db, 'prescriptions', id), {
                status: 'rejected',
                rejectionReason: reason,
                pharmacistId,
                updatedAt: serverTimestamp(),
            })

            // Notify Customer/Admin
            await notificationService.create({
                title: 'Prescription Rejected',
                message: `Prescription #${id.slice(0, 8)} rejected. Reason: ${reason}`,
                type: 'prescription',
                link: `/dashboard/prescriptions/${id}`,
                metadata: { prescriptionId: id, status: 'rejected' }
            } as any)

        } catch (error: any) {
            throw new Error(`Failed to reject prescription: ${error.message}`)
        }
    },
}
