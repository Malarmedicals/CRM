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
          const products = await productService.getAllProducts()
          const lowStock = await productService.getLowStockProducts()
          const expiring = await productService.getExpiringProducts()
          const orders = await orderService.getAllOrders()

          // Calculate Stats
          const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0)
          const pendingShipments = orders.filter(
            order => order.deliveryStatus !== 'delivered' && order.status !== 'cancelled'
          ).length

          setStats({
            totalProducts: products.length,
            lowStockCount: lowStock.length,
            expiringCount: expiring.length,
            totalOrders: orders.length,
            totalSales,
            pendingShipments,
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
              // Try to find category from product list if not in item
              let category = item.category
              if (!category) {
                const product = products.find(p => p.id === item.productId)
                category = product?.category || 'Uncategorized'
              }

              const itemTotal = item.price * item.quantity
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
          const productSalesMap = new Map<string, number>()
          orders.forEach(order => {
            order.products.forEach(item => {
              const productId = item.productId
              if (productSalesMap.has(productId)) {
                productSalesMap.set(productId, productSalesMap.get(productId)! + item.quantity)
              } else {
                productSalesMap.set(productId, item.quantity)
              }
            })
          })

          const processedTopProducts = Array.from(productSalesMap.entries())
            .map(([id, sales]) => {
              const product = products.find(p => p.id === id)
              return { name: product?.name || 'Unknown Product', sales }
            })
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
    <div className="min-h-screen bg-[#F7F9FB] pb-10">
      <main className="px-6 py-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back, here's what's happening at Malar Medicals today.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-900">Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <DashboardKPICard
            title="Total Orders Today"
            value={stats.totalOrders}
            icon={ShoppingBag}
            trend={{ value: 12, isPositive: true }}
            color="teal"
          />
          <DashboardKPICard
            title="Revenue Today"
            value={`₹${stats.totalSales.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
            color="blue"
          />
          <DashboardKPICard
            title="Pending Shipments"
            value={stats.pendingShipments}
            icon={Truck}
            color="default"
          />
          <DashboardKPICard
            title="Out-of-Stock Alerts"
            value={stats.lowStockCount}
            icon={PackageX}
            color="coral"
          />
          <DashboardKPICard
            title="Low-Batch Expiry"
            value={stats.expiringCount}
            icon={AlertOctagon}
            color="coral"
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
