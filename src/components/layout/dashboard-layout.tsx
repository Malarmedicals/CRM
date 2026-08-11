'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/features/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet'
import { BarChart3, Package, Users, ShoppingCart, Mail, LogOut, PanelLeftClose, PanelRightClose, ChevronDown, Warehouse, FileText, Shield, MessageSquare, BookOpen } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PermissionProvider, usePermissions } from '@/components/auth/permission-provider'
import type { PermissionKey } from '@/lib/constants/permissions'

interface MenuItem {
  href?: string
  label: string
  icon: any
  subItems?: { href: string; label: string; requiredPermission?: PermissionKey }[]
  requiredPermission?: PermissionKey
}

const menuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, requiredPermission: 'dashboard.view' },
  {
    label: 'Content Management',
    icon: Package,
    subItems: [
      { href: '/dashboard/products', label: 'Product Management', requiredPermission: 'products.view' },
      { href: '/dashboard/categories', label: 'Category Management', requiredPermission: 'categories.view' },
      { href: '/dashboard/banners', label: 'Banner Management', requiredPermission: 'banners.view' },
      { href: '/dashboard/seo-content', label: 'SEO Content Blocks' },
      { href: '/dashboard/blog', label: 'Blog & Health Content', requiredPermission: 'blog.view' },
    ]
  },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Warehouse, requiredPermission: 'inventory.view' },
  { href: '/dashboard/users', label: 'Users', icon: Users, requiredPermission: 'users.view' },
  { href: '/dashboard/roles', label: 'Roles', icon: Shield, requiredPermission: 'roles.view' },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, requiredPermission: 'orders.view' },
  { href: '/dashboard/enquiries', label: 'Customer Enquiries', icon: MessageSquare },
  { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/dashboard/crm', label: 'CRM Tools', icon: Mail },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  
  const { hasPermission } = usePermissions()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        // Optional: redirect to login if not authenticated
        // router.push('/')
      }
    })
    return () => subscription.unsubscribe()
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

  // Filter main items and sub items based on permissions
  const filteredMenuItems = menuItems.map(item => {
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(subItem => 
        !subItem.requiredPermission || hasPermission(subItem.requiredPermission)
      )
      return { ...item, subItems: filteredSubItems }
    }
    return item
  }).filter(item => {
    // Hide item if it requires a permission the user doesn't have
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false
    // Hide parent if it has subitems but all were filtered out
    if (item.subItems && item.subItems.length === 0) return false
    return true
  })

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isExpanded = sidebarOpen || isMobile;
    
    return (
    <aside className={`h-full w-full bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between h-16 shrink-0 bg-white">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <span className="font-bold text-white">M</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Malar CRM</h1>
        </div>
        {!isMobile && (
          <div className={`flex justify-center shrink-0 ${isExpanded ? '' : 'w-full'}`}>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5 text-slate-500" /> : <PanelRightClose className="h-5 w-5 text-slate-500" />}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-scroll overflow-x-hidden bg-white no-scrollbar">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isSubmenuOpen = openSubmenu === item.label
          
          const checkActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          const isActive = (item.href && checkActive(item.href)) || (hasSubItems && item.subItems?.some((sub: any) => checkActive(sub.href)))

          if (hasSubItems) {
            return (
              <div key={item.label}>
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group text-sm ${isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } ${!isExpanded ? 'justify-center' : ''}`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'} ${!isExpanded ? 'h-5 w-5' : ''}`} />
                  <div className={`flex-1 flex items-center justify-between overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                    <span className="text-left font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Submenu Items */}
                <div className={`grid transition-all duration-300 ease-in-out ${isSubmenuOpen && isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="ml-5 space-y-0.5 border-l border-slate-200 pl-2">
                      {item.subItems?.map((subItem: any) => {
                        const isSubActive = checkActive(subItem.href)
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            className="block"
                          >
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${isSubActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                              }`}>
                              {subItem.label}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href!} onClick={() => isMobile && setIsMobileOpen(false)} title={!isExpanded ? item.label : undefined}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group text-sm ${isActive
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${!isExpanded ? 'justify-center' : ''}`}>
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'} ${!isExpanded ? 'h-5 w-5' : ''}`} />
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
                  <span className="font-medium whitespace-nowrap block">
                    {item.label}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-slate-100 shrink-0 bg-white transition-all duration-300 ${!isExpanded ? 'flex justify-center' : ''}`}>
        <Button
          variant="ghost"
          size={isExpanded ? "sm" : "icon"}
          onClick={handleLogout}
          disabled={loading}
          className={`text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 ${isExpanded ? 'w-full justify-start gap-2' : ''}`}
          title={!isExpanded ? 'Logout' : undefined}
        >
          <LogOut className={`shrink-0 ${isExpanded ? 'h-4 w-4' : 'h-5 w-5'}`} />
          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>
            <span className="whitespace-nowrap block">
              {loading ? 'Logging out...' : 'Logout'}
            </span>
          </div>
        </Button>
      </div>
    </aside>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-slate-200 bg-white">
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
      <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <DashboardHeader onMenuClick={() => setIsMobileOpen(true)} />

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <PermissionProvider>
      <DashboardLayoutInner>
        {children}
      </DashboardLayoutInner>
    </PermissionProvider>
  )
}
