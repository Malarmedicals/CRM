'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '@/features/auth'
import { roleService, Role } from '@/features/roles'
import type { PermissionKey } from '@/lib/constants/permissions'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface PermissionContextType {
  permissions: PermissionKey[]
  role: Role | null
  isLoading: boolean
  hasPermission: (permission: PermissionKey) => boolean
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  role: null,
  isLoading: true,
  hasPermission: () => false,
})

export const usePermissions = () => useContext(PermissionContext)

export const PermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const [permissions, setPermissions] = useState<PermissionKey[]>([])
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      const user = await authService.getCurrentUser()
      if (!user) {
        setPermissions([])
        setRole(null)
        return
      }

      const profile = await authService.getUserProfile(user.id)
      if (profile && profile.role) {
        const userRole = await roleService.getRoleByName(profile.role)
        if (userRole) {
          setRole(userRole)
          setPermissions(userRole.permissions || [])
        } else {
          setRole(null)
          setPermissions([])
        }
      }
    } catch (error: any) {
      console.error('Failed to load permissions:', error.message || error)
      setPermissions([])
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadPermissions()
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasPermission = (permission: PermissionKey) => {
    return permissions.includes(permission)
  }

  return (
    <PermissionContext.Provider value={{ permissions, role, isLoading, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  )
}

export const PermissionGuard = ({
  required,
  children,
  fallback = null,
}: {
  required: PermissionKey
  children: React.ReactNode
  fallback?: React.ReactNode
}) => {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return null
  
  if (hasPermission(required)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
