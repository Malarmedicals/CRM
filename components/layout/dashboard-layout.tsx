'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth-service'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BarChart3, Package, Users, ShoppingCart, Filter, Mail, LogOut, Menu, X, User, MoreVertical } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Fetch user profile from Firestore
        import('firebase/firestore').then(({ doc, getDoc }) => {
          import('@/lib/firebase').then(({ db }) => {
            getDoc(doc(db, 'users', currentUser.uid))
              .then((userDoc) => {
                if (userDoc.exists()) {
                  setUserProfile(userDoc.data())
                }
              })
              .catch(console.error)
          })
        })
      }
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/dashboard/products', label: 'Products', icon: Package },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/leads', label: 'Leads', icon: Filter },
    { href: '/dashboard/crm', label: 'CRM Tools', icon: Mail },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Container - Handles Hover */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-16'
          }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <aside className="h-full w-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="px-3 py-4 border-b border-sidebar-border flex items-center justify-between h-16 shrink-0">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">M</span>
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground animate-in fade-in duration-300">Malar CRM</h1>
              </div>
            ) : (
              <div className="w-full h-6" /> // Empty placeholder to maintain height
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${sidebarOpen
                    ? 'hover:bg-sidebar-accent text-sidebar-foreground'
                    : 'justify-center hover:bg-sidebar-accent text-sidebar-foreground'
                    }`}>
                    <Icon className={`h-5 w-5 transition-colors ${sidebarOpen ? '' : 'h-6 w-6'}`} />
                    {sidebarOpen && (
                      <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loading}
              className={`w-full ${sidebarOpen ? 'justify-start gap-2' : 'justify-center px-0'}`}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && (loading ? 'Logging out...' : 'Logout')}
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col ml-16 transition-all duration-300 h-screen">
        {/* Header */}
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {userProfile?.displayName || user?.email || 'User'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {userProfile?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                  {userProfile?.role && (
                    <p className="text-xs text-muted-foreground capitalize">
                      Role: {userProfile.role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={loading}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loading ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
