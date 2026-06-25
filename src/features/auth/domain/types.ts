// Auth domain types and Zod validation schemas
import { z } from 'zod'

export type UserRole = 'admin' | 'manager' | 'user' | 'customer'

export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  role: UserRole
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

// Zod schemas for runtime validation
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
