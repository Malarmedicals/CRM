'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authService } from '@/features/auth/auth-service'
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
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BarChart3, Package, Users, ShoppingCart, Filter, Mail, LogOut, Menu, X, User, MoreVertical, ChevronDown, Warehouse } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

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
    {
      label: 'Content Management',
      icon: Package,
      subItems: [
        { href: '/dashboard/products', label: 'Product Management' },
        { href: '/dashboard/banners/add', label: 'Add Banner' },
      ]
    },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/crm', label: 'CRM Tools', icon: Mail },
  ]

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside className={`h-full w-full bg-sidebar border-r border-sidebar-border flex flex-col ${isMobile ? '' : 'shadow-2xl'} overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="px-3 py-4 border-b border-sidebar-border flex items-center justify-between h-16 shrink-0">
        {(sidebarOpen || isMobile) ? (
          <div className="flex items-center gap-3 px-2 w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">M</span>
              </div>
              <h1 className="text-xl font-bold text-sidebar-foreground animate-in fade-in duration-300">Malar CRM</h1>
            </div>
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          // @ts-ignore
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isSubmenuOpen = openSubmenu === item.label

          if (hasSubItems) {
            return (
              <div
                key={item.label}
                onMouseEnter={() => {
                  setOpenSubmenu(item.label)
                  if (!sidebarOpen && !isMobile) {
                    setSidebarOpen(true)
                  }
                }}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <button
                  onClick={() => {
                    if (openSubmenu === item.label) {
                      setOpenSubmenu(null)
                    } else {
                      setOpenSubmenu(item.label)
                      if (!sidebarOpen && !isMobile) {
                        setSidebarOpen(true)
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${sidebarOpen || isMobile
                    ? 'hover:bg-sidebar-accent text-sidebar-foreground'
                    : 'justify-center hover:bg-sidebar-accent text-sidebar-foreground'
                    }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${sidebarOpen || isMobile ? '' : 'h-6 w-6'}`} />
                  {(sidebarOpen || isMobile) && (
                    <>
                      <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300 flex-1 text-left">
                        {item.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Submenu Items */}
                {isSubmenuOpen && (sidebarOpen || isMobile) && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-2 animate-in slide-in-from-top-2 duration-200">
                    {/* @ts-ignore */}
                    {item.subItems.map((subItem: any) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => isMobile && setIsMobileOpen(false)}
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                          {subItem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href!} onClick={() => isMobile && setIsMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${sidebarOpen || isMobile
                ? 'hover:bg-sidebar-accent text-sidebar-foreground'
                : 'justify-center hover:bg-sidebar-accent text-sidebar-foreground'
                }`}>
                <Icon className={`h-5 w-5 transition-colors ${sidebarOpen || isMobile ? '' : 'h-6 w-6'}`} />
                {(sidebarOpen || isMobile) && (
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
          className={`w-full ${sidebarOpen || isMobile ? 'justify-start gap-2' : 'justify-center px-0'}`}
        >
          <LogOut className="h-4 w-4" />
          {(sidebarOpen || isMobile) && (loading ? 'Logging out...' : 'Logout')}
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-16'
          }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-sidebar">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 h-screen ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        {/* Header */}
        <header className="bg-background border-b border-border px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
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
                <span className="hidden md:inline">{userProfile?.displayName || user?.email || 'User'}</span>
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
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
