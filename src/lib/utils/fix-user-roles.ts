/**
 * Migration Script: Add Default Roles to Users
 * 
 * This script finds all users without a role field and assigns them the 'customer' role.
 * Run this once to fix existing users in the database.
 * 
 * Usage: Import and call fixUserRoles() from your admin panel or run manually
 */

import { supabase } from '@/lib/supabase/client'

export async function fixUserRoles() {
    try {
        console.log('Starting user role migration...')

        const { data: users, error } = await supabase.from('crm_users').select('*')
        if (error) throw error
        
        let updatedCount = 0
        let totalUsers = users.length

        for (const user of users) {
            // Check if role is missing or invalid
            if (!user.role || typeof user.role !== 'string') {
                console.log(`Fixing user ${user.id}: ${user.email || 'no email'}`)

                // Assign default role 'customer'
                await supabase.from('crm_users').update({ role: 'customer' }).eq('id', user.id)
                updatedCount++
            }
        }

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
