import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const { email, password, displayName, role } = await request.json()
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase admin configuration")
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify token
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !requestingUser) {
      return NextResponse.json({ error: "Unauthorized or invalid token" }, { status: 401 })
    }

    // Verify requesting user's role
    const { data: currentUserRow } = await supabaseAdmin.from('crm_users').select('role').eq('uid', requestingUser.id).single()
    if (!currentUserRow) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 })
    }

    const currentRole = currentUserRow.role
    const targetRole = role || 'customer'

    if (targetRole === 'Super Administrator' && currentRole !== 'Super Administrator') {
      return NextResponse.json({ error: "Only a Super Administrator can create another Super Administrator." }, { status: 403 })
    }
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        displayName
      }
    })
    
    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
        return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 })
      }
      throw authError
    }
    
    const userId = authData.user.id
    
    // Insert into crm_users
    const { error: dbError } = await supabaseAdmin.from('crm_users').insert({
      uid: userId,
      email,
      display_name: displayName,
      role: targetRole,
      is_active: true
    })
    
    if (dbError) throw dbError
    
    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 400 })
  }
}
