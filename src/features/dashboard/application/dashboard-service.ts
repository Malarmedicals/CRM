import { productService } from '@/features/products'
import { orderService } from '@/features/orders'
import { logger } from '@/core/logger/logger'

export const dashboardService = {
  async getDashboardStats() {
    try {
      const [productCount, lowStock, expiring, orders] = await Promise.all([
        productService.getProductCount(),
        productService.getLowStockProducts(),
        productService.getExpiringProducts(),
        orderService.getOrders(),
      ])

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)

      const getOrdersInDateRange = (start: Date, end?: Date) => {
        return orders.filter((order: any) => {
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
      const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)

      const yesterdayOrdersCount = yesterdayOrders.length
      const yesterdayRevenue = yesterdayOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      const orderTrend = calculateTrend(todayOrdersCount, yesterdayOrdersCount)
      const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue)

      const pendingShipments = orders.filter(
        (order: any) => order.deliveryStatus !== 'delivered' && order.status !== 'cancelled'
      ).length

      const last30Days = [...Array(30)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        return d.toISOString().split('T')[0]
      })

      const salesMap = new Map<string, number>()
      orders.forEach((order: any) => {
        const date = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : ''
        if (date && salesMap.has(date)) {
          salesMap.set(date, salesMap.get(date)! + (order.totalAmount || 0))
        } else if (date) {
          salesMap.set(date, order.totalAmount || 0)
        }
      })

      const salesData = last30Days.map((date) => ({
        name: date.split('-')[2],
        value: salesMap.get(date) || 0,
      }))

      const categoryMap = new Map<string, number>()
      orders.forEach((order: any) => {
        const orderItems = order.items || order.products || []
        orderItems.forEach((item: any) => {
          const category = item.category || 'General'
          const itemTotal = (item.price || 0) * (item.quantity || 1)
          if (categoryMap.has(category)) {
            categoryMap.set(category, categoryMap.get(category)! + itemTotal)
          } else {
            categoryMap.set(category, itemTotal)
          }
        })
      })

      const categoryData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      const productSalesMap = new Map<string, { name: string; sales: number }>()
      orders.forEach((order: any) => {
        const orderItems = order.items || order.products || []
        orderItems.forEach((item: any) => {
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

      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      const expiringMedicines = expiring.slice(0, 5).map((p: any) => {
        const daysUntilExpiry = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        return {
          name: p.name,
          batch: p.batchNumber,
          expiry: `${daysUntilExpiry} Days`,
          stock: p.stockQuantity,
        }
      })

      return {
        stats: {
          totalProducts: productCount,
          lowStockCount: lowStock.length,
          expiringCount: expiring.length,
          totalOrders: todayOrdersCount,
          totalSales: todayRevenue,
          pendingShipments,
          orderTrend,
          revenueTrend,
        },
        salesData,
        categoryData,
        topProducts,
        expiringMedicines,
      }
    } catch (error: any) {
      logger.error('Failed to aggregate dashboard stats', error)
      throw new Error(`Failed to load dashboard statistics: ${error.message}`)
    }
  },
}
