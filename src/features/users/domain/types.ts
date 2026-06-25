import { z } from 'zod'

export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  role: 'admin' | 'manager' | 'customer'
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'customer']),
})
