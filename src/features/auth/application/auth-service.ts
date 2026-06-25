// Auth Application Layer: Business logic / use-cases.
// Orchestrates calls to the repository. No direct Supabase calls here.
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { logger } from '@/core/logger/logger'
import { UnauthorizedError } from '@/core/errors/AppError'
import { authRepository, mapDbRowToUser } from '../infrastructure/auth-repository'
import type { User } from '../domain/types'

export const authService = {
  async signUp(email: string, password: string, displayName: string): Promise<SupabaseUser> {
    const supabaseUser = await authRepository.signUp(email, password, displayName)
    logger.info('User signed up', { userId: supabaseUser.id })

    const isFirstUser = (await authRepository.getUserCount()) === 0
    try {
      await authRepository.insertUser({
        uid: supabaseUser.id,
        email,
        display_name: displayName,
        role: isFirstUser ? 'admin' : 'user',
        is_active: true,
      })
    } catch (err) {
      logger.error('Failed to insert user profile after signup', err as Error, { userId: supabaseUser.id })
    }

    return supabaseUser
  },

  async signIn(email: string, password: string): Promise<SupabaseUser> {
    const supabaseUser = await authRepository.signIn(email, password)

    const userRow = await authRepository.findUserByUid(supabaseUser.id)

    if (!userRow) {
      // Create profile if missing (e.g. first login after manual creation)
      const isFirstUser = (await authRepository.getUserCount()) === 0
      await authRepository.insertUser({
        uid: supabaseUser.id,
        email,
        display_name: supabaseUser.user_metadata?.displayName || '',
        role: isFirstUser ? 'admin' : 'user',
        is_active: true,
      })
      logger.info('Created missing user profile on sign in', { userId: supabaseUser.id })
    } else if (userRow.is_active === false) {
      await authRepository.signOut()
      throw new UnauthorizedError('User account is blocked')
    }

    logger.info('User signed in', { userId: supabaseUser.id })
    return supabaseUser
  },

  async signOut(): Promise<void> {
    await authRepository.signOut()
    logger.info('User signed out')
  },

  async getCurrentUser(): Promise<SupabaseUser | null> {
    return authRepository.getCurrentAuthUser()
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const row = await authRepository.findUserByUid(uid)
    if (!row) return null
    return mapDbRowToUser(row)
  },
}
