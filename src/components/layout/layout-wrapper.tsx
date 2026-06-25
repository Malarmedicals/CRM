'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { useOrderListener } from '@/features/orders/use-order-listener'
import { usePrescriptionListener } from '@/features/prescriptions/use-prescription-listener'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isDashboardRoute = pathname?.startsWith('/dashboard')

  // Activate global listeners (failsafe)
  useOrderListener();
  usePrescriptionListener();

  useEffect(() => {
    if (isDashboardRoute) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true)
          setLoading(false)
        } else {
          router.push('/')
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setIsAuthenticated(true)
          setLoading(false)
        } else {
          setIsAuthenticated(false)
          router.push('/')
        }
      })

      return () => subscription.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [isDashboardRoute, router])

  if (loading && isDashboardRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isDashboardRoute && isAuthenticated) {
    return <DashboardLayout>{children}</DashboardLayout>
  }

  return <>{children}</>
}
