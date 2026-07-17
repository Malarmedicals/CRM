import { z } from 'zod'

export interface User {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  role: string
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

export const updateUserRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
})
