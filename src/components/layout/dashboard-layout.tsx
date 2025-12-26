'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/features/auth/auth-service'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet'
import { BarChart3, Package, Users, ShoppingCart, Mail, LogOut, MoreVertical, ChevronDown, Warehouse, FileText } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        // Optional: redirect to login if not authenticated
        // router.push('/')
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
    { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: FileText },
    { href: '/dashboard/crm', label: 'CRM Tools', icon: Mail },
  ]

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <aside className={`h-full w-full bg-sidebar border-r border-sidebar-border flex flex-col ${isMobile ? '' : 'shadow-2xl'} overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between h-16 shrink-0 bg-white">
        {(sidebarOpen || isMobile) ? (
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm">
                <span className="font-bold text-white">M</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 animate-in fade-in duration-300">Malar CRM</h1>
            </div>
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <MoreVertical className="h-5 w-5 text-slate-500" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <MoreVertical className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto bg-white">
        {menuItems.map((item) => {
          const Icon = item.icon
          // @ts-ignore
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isSubmenuOpen = openSubmenu === item.label
          const isActive = item.href === pathname || (hasSubItems && item.subItems?.some((sub: any) => sub.href === pathname))

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
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'} ${sidebarOpen || isMobile ? '' : 'h-6 w-6'}`} />
                  {(sidebarOpen || isMobile) && (
                    <>
                      <span className="flex-1 text-left">
                        {item.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {/* Submenu Items */}
                {isSubmenuOpen && (sidebarOpen || isMobile) && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2 animate-in slide-in-from-top-2 duration-200">
                    {/* @ts-ignore */}
                    {item.subItems.map((subItem: any) => {
                      const isSubActive = subItem.href === pathname
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => isMobile && setIsMobileOpen(false)}
                        >
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isSubActive
                            ? 'bg-teal-50 text-teal-700 font-medium'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}>
                            {subItem.label}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href!} onClick={() => isMobile && setIsMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}>
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} ${sidebarOpen || isMobile ? '' : 'h-6 w-6'}`} />
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
      <div className="p-4 border-t border-sidebar-border shrink-0 bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
          className={`w-full text-slate-500 hover:text-red-600 hover:bg-red-50 ${sidebarOpen || isMobile ? 'justify-start gap-2' : 'justify-center px-0'}`}
        >
          <LogOut className="h-4 w-4" />
          {(sidebarOpen || isMobile) && (loading ? 'Logging out...' : 'Logout')}
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#F7F9FB] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile Navigation</SheetTitle>
            <SheetDescription>
              Navigation menu for mobile devices
            </SheetDescription>
          </SheetHeader>
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-300 h-screen ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <DashboardHeader onMenuClick={() => setIsMobileOpen(true)} />

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
