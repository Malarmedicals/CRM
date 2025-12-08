/**
 * Migration Script: Add Default Roles to Users
 * 
 * This script finds all users without a role field and assigns them the 'customer' role.
 * Run this once to fix existing users in the database.
 * 
 * Usage: Import and call fixUserRoles() from your admin panel or run manually
 */

import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function fixUserRoles() {
    try {
        console.log('Starting user role migration...')

        const usersSnapshot = await getDocs(collection(db, 'users'))
        let updatedCount = 0
        let totalUsers = 0

        const updates: Promise<void>[] = []

        usersSnapshot.docs.forEach((userDoc) => {
            totalUsers++
            const userData = userDoc.data()

            // Check if role is missing or invalid
            if (!userData.role || typeof userData.role !== 'string') {
                console.log(`Fixing user ${userDoc.id}: ${userData.email || 'no email'}`)

                // Assign default role 'customer'
                const updatePromise = updateDoc(doc(db, 'users', userDoc.id), {
                    role: 'customer',
                    updatedAt: Timestamp.now(),
                })

                updates.push(updatePromise)
                updatedCount++
            }
        })

        // Execute all updates
        await Promise.all(updates)

        console.log(`Migration complete!`)
        console.log(`Total users: ${totalUsers}`)
        console.log(`Users updated: ${updatedCount}`)
        console.log(`Users already had roles: ${totalUsers - updatedCount}`)

        return {
            success: true,
            totalUsers,
            updatedCount,
            message: `Successfully updated ${updatedCount} users out of ${totalUsers} total users.`
        }
    } catch (error: any) {
        console.error('Migration failed:', error)
        return {
            success: false,
            error: error.message,
            message: `Migration failed: ${error.message}`
        }
    }
}

// Export for manual execution
if (typeof window !== 'undefined') {
    (window as any).fixUserRoles = fixUserRoles
}
