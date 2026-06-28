import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Admin user details
const ADMIN_EMAIL = 'admin@malarmedicals.com'
const ADMIN_PASSWORD = 'Admin@123456'
const ADMIN_PHONE = '+919876543210'
const ADMIN_NAME = 'Admin User'

async function createAdminUser() {
    try {
        console.log('🔐 Creating admin user...')

        let userId: string | null = null

        // Try creating the user
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: {
                display_name: ADMIN_NAME,
                phone_number: ADMIN_PHONE
            }
        })

        if (createError) {
            if (createError.message.includes('already exists') || createError.message.includes('already been registered')) {
                console.log('✅ Admin user already exists in Authentication')
                const { data } = await supabaseAdmin.auth.admin.listUsers()
                const existing = data.users.find((u: any) => u.email === ADMIN_EMAIL)
                if (existing) {
                    userId = existing.id
                    // Ensure the existing user is confirmed
                    await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true })
                    console.log('✅ Existing user email confirmed manually')
                }
            } else {
                throw createError
            }
        } else {
            console.log('✅ Admin user created in Authentication')
            userId = authData.user.id
        }

        if (!userId) throw new Error('Could not resolve Admin User ID')

        // Create/Update Supabase user document
        const { error: dbError } = await supabaseAdmin.from('crm_users').upsert({
            uid: userId,
            email: ADMIN_EMAIL,
            phone_number: ADMIN_PHONE,
            display_name: ADMIN_NAME,
            role: 'admin',
            is_active: true,
        }, { onConflict: 'uid' })

        if (dbError) throw dbError

        console.log('✅ Admin user document created/updated in Database')
        console.log('\n📧 Admin Login Credentials:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`Email:    ${ADMIN_EMAIL}`)
        console.log(`Password: ${ADMIN_PASSWORD}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('\n⚠️  IMPORTANT: Change the password after first login!')
        console.log('✨ Admin user setup complete!\n')

    } catch (error) {
        console.error('❌ Error creating admin user:', error)
        process.exit(1)
    }
}

createAdminUser()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
