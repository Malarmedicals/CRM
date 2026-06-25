'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { dashboardService } from '@/features/dashboard'
import { DashboardKPICard } from '@/components/dashboard/dashboard-kpi-card'
import {
  SalesOverviewChart,
  RevenueBreakdownChart,
  TopSellingChart
} from '@/components/dashboard/dashboard-charts'
import {
  ExpiringMedicinesWidget,
  PendingApprovalsWidget,
  DeliveryPerformanceWidget
} from '@/components/dashboard/dashboard-widgets'
import {
  ShoppingBag,
  DollarSign,
  Truck,
  AlertOctagon,
  PackageX
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingShipments: 0,
    orderTrend: 0,
    revenueTrend: 0,
  })
  const [salesData, setSalesData] = useState<{ name: string; value: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number }[]>([])
  const [expiringMedicines, setExpiringMedicines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const dashboardData = await dashboardService.getDashboardStats()
          setStats(dashboardData.stats)
          setSalesData(dashboardData.salesData)
          setCategoryData(dashboardData.categoryData)
          setTopProducts(dashboardData.topProducts)
          setExpiringMedicines(dashboardData.expiringMedicines)
        } catch (error) {
          console.error('Failed to load stats:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-muted/40 pb-10">
      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Welcome back, here's what's happening at Malar Medicals today.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-foreground/80">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <DashboardKPICard
            title="Total Orders Today"
            value={stats.totalOrders}
            icon={ShoppingBag}
            trend={{ value: Math.abs(stats.orderTrend), isPositive: stats.orderTrend >= 0 }}
            color="teal"
            href="/dashboard/orders"
          />
          <DashboardKPICard
            title="Revenue Today"
            value={`₹${stats.totalSales.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: Math.abs(stats.revenueTrend), isPositive: stats.revenueTrend >= 0 }}
            color="blue"
            href="/dashboard/orders"
          />
          <DashboardKPICard
            title="Pending Shipments"
            value={stats.pendingShipments}
            icon={Truck}
            color="default"
            href="/dashboard/orders"
          />
          <DashboardKPICard
            title="Out-of-Stock Alerts"
            value={stats.lowStockCount}
            icon={PackageX}
            color="coral"
            href="/dashboard/inventory"
          />
          <DashboardKPICard
            title="Low-Batch Expiry"
            value={stats.expiringCount}
            icon={AlertOctagon}
            color="coral"
            href="/dashboard/inventory"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px]">
            <SalesOverviewChart data={salesData} />
          </div>
          <div className="h-[400px]">
            <RevenueBreakdownChart data={categoryData} />
          </div>
        </div>

        {/* Widgets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TopSellingChart data={topProducts} />
          </div>
          <div className="lg:col-span-1">
            <ExpiringMedicinesWidget medicines={expiringMedicines} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <PendingApprovalsWidget />
            <DeliveryPerformanceWidget />
          </div>
        </div>

      </main>
    </div>
  )
}
