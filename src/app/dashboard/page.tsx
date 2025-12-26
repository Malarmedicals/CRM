'use client'

import { useState, useEffect } from 'react'
import { productService } from '@/features/products/product-service'
import { orderService } from '@/features/orders/order-service'
import { auth } from '@/lib/firebase'
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [productCount, lowStock, expiring, orders] = await Promise.all([
            productService.getProductCount(),
            productService.getLowStockProducts(),
            productService.getExpiringProducts(),
            orderService.getRecentOrders(30)
          ])

          // Calculate Stats for Today
          const now = new Date()
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const yesterdayStart = new Date(todayStart)
          yesterdayStart.setDate(yesterdayStart.getDate() - 1)

          // Helper to filter orders by date range
          const getOrdersInDateRange = (start: Date, end?: Date) => {
            return orders.filter(order => {
              if (!order.createdAt) return false
              const orderDate = new Date(order.createdAt)
              if (end) {
                return orderDate >= start && orderDate < end
              }
              return orderDate >= start
            })
          }

          const todayOrders = getOrdersInDateRange(todayStart)
          const yesterdayOrders = getOrdersInDateRange(yesterdayStart, todayStart)

          const todayOrdersCount = todayOrders.length
          const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

          const yesterdayOrdersCount = yesterdayOrders.length
          const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

          // Calculate Trends function
          const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
          }

          const orderTrend = calculateTrend(todayOrdersCount, yesterdayOrdersCount)
          const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue)

          // Calculate Pending Shipments (from all recent orders)
          const pendingShipments = orders.filter(
            order => order.deliveryStatus !== 'delivered' && order.status !== 'cancelled'
          ).length

          setStats({
            totalProducts: productCount,
            lowStockCount: lowStock.length,
            expiringCount: expiring.length,
            totalOrders: todayOrdersCount,
            totalSales: todayRevenue,
            pendingShipments,
            orderTrend,
            revenueTrend,
          })

          // Process Sales Overview (Last 30 Days)
          const last30Days = [...Array(30)].map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (29 - i))
            return d.toISOString().split('T')[0]
          })

          const salesMap = new Map<string, number>()
          orders.forEach(order => {
            const date = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : ''
            if (date && salesMap.has(date)) {
              salesMap.set(date, salesMap.get(date)! + order.totalAmount)
            } else if (date) {
              salesMap.set(date, order.totalAmount)
            }
          })

          const processedSalesData = last30Days.map(date => ({
            name: date.split('-')[2], // Day only
            value: salesMap.get(date) || 0
          }))
          setSalesData(processedSalesData)

          // Process Revenue by Category
          const categoryMap = new Map<string, number>()
          orders.forEach(order => {
            order.products.forEach(item => {
              // Reliant on item having category snapshot. 
              // If missing, use 'General' or similar. 
              // We avoid fetching 1000s of products just for this fallback.
              const category = item.category || 'General'

              const itemTotal = (item.price || 0) * (item.quantity || 1)
              if (categoryMap.has(category)) {
                categoryMap.set(category, categoryMap.get(category)! + itemTotal)
              } else {
                categoryMap.set(category, itemTotal)
              }
            })
          })

          const processedCategoryData = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5 categories
          setCategoryData(processedCategoryData)

          // Process Top Selling Products
          const productSalesMap = new Map<string, { name: string, sales: number }>()
          orders.forEach(order => {
            order.products.forEach(item => {
              const productId = item.productId || 'unknown'
              const productName = item.productName || item.name || 'Unknown Product'

              if (productSalesMap.has(productId)) {
                const existing = productSalesMap.get(productId)!
                productSalesMap.set(productId, { ...existing, sales: existing.sales + item.quantity })
              } else {
                productSalesMap.set(productId, { name: productName, sales: item.quantity })
              }
            })
          })

          const processedTopProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5) // Top 5 products
          setTopProducts(processedTopProducts)

          // Process Expiring Medicines Widget Data
          const processedExpiring = expiring.slice(0, 5).map(p => {
            const daysUntilExpiry = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
            return {
              name: p.name,
              batch: p.batchNumber,
              expiry: `${daysUntilExpiry} Days`,
              stock: p.stockQuantity
            }
          })
          setExpiringMedicines(processedExpiring)

        } catch (error) {
          console.error('Failed to load stats:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
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
