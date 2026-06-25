// Auth Infrastructure Layer: All direct Supabase calls are here.
// No other layer should call Supabase directly for auth operations.
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '../domain/types'

const USERS_TABLE = 'users'

export const authRepository = {
  async signUp(email: string, password: string, displayName: string): Promise<SupabaseUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { displayName } },
    })
    if (error) throw error
    if (!data.user) throw new Error('No user returned after signup')
    return data.user
  },

  async signIn(email: string, password: string): Promise<SupabaseUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('No user returned after signin')
    return data.user
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentAuthUser(): Promise<SupabaseUser | null> {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  },

  async getUserCount(): Promise<number> {
    const { count } = await supabase.from(USERS_TABLE).select('*', { count: 'exact', head: true })
    return count || 0
  },

  async findUserByUid(uid: string): Promise<Record<string, any> | null> {
    const { data } = await supabase.from(USERS_TABLE).select('*').eq('uid', uid).single()
    return data || null
  },

  async insertUser(userData: {
    uid: string
    email: string
    display_name: string
    role: string
    is_active: boolean
  }): Promise<void> {
    const { error } = await supabase.from(USERS_TABLE).insert(userData)
    if (error) throw error
  },
}

// Data mapping: converts raw DB rows to domain User objects
export function mapDbRowToUser(row: any): User {
  const normalizeRole = (role: any): User['role'] => {
    if (!role || typeof role !== 'string') return 'user'
    const normalized = role.toLowerCase().trim()
    if (normalized === 'admin' || normalized === 'manager' || normalized === 'user' || normalized === 'customer') {
      return normalized as User['role']
    }
    return 'user'
  }

  return {
    id: row.uid,
    email: row.email || '',
    displayName: row.display_name || 'Unknown User',
    phoneNumber: row.phone_number,
    role: normalizeRole(row.role),
    isBlocked: row.is_active === false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}
