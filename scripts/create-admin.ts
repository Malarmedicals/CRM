/**
 * Create Admin User Script
 * 
 * This script creates an admin user in Firebase Authentication
 * and adds the corresponding user document in Firestore.
 */

import * as admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    })
}

const auth = getAuth()
const db = getFirestore()

// Admin user details
const ADMIN_EMAIL = 'admin@malarmedicals.com'
const ADMIN_PASSWORD = 'Admin@123456'  // Change this to a secure password
const ADMIN_PHONE = '+919876543210'
const ADMIN_NAME = 'Admin User'

async function createAdminUser() {
    try {
        console.log('🔐 Creating admin user...')

        // Check if user already exists
        let userRecord
        try {
            userRecord = await auth.getUserByEmail(ADMIN_EMAIL)
            console.log('✅ Admin user already exists in Authentication')
            console.log(`   UID: ${userRecord.uid}`)
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create new user
                userRecord = await auth.createUser({
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD,
                    phoneNumber: ADMIN_PHONE,
                    displayName: ADMIN_NAME,
                    emailVerified: true,
                })
                console.log('✅ Admin user created in Authentication')
                console.log(`   UID: ${userRecord.uid}`)
            } else {
                throw error
            }
        }

        // Create/Update Firestore user document
        const userDoc = {
            uid: userRecord.uid,
            email: ADMIN_EMAIL,
            phoneNumber: ADMIN_PHONE,
            displayName: ADMIN_NAME,
            role: 'admin',
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }

        await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true })
        console.log('✅ Admin user document created/updated in Firestore')

        console.log('\n📧 Admin Login Credentials:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`Email:    ${ADMIN_EMAIL}`)
        console.log(`Password: ${ADMIN_PASSWORD}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('\n⚠️  IMPORTANT: Change the password after first login!')
        console.log('✨ Admin user setup complete!\n')

    } catch (error) {
        console.error('❌ Error creating admin user:', error)
        throw error
    }
}

// Run the script
createAdminUser()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
