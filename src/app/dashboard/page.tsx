'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { productService } from '@/features/products/product-service'
import { orderService } from '@/features/orders/order-service'
import { auth } from '@/lib/firebase'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, TrendingUp, Users, Package } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalOrders: 0,
    totalSales: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const products = await productService.getAllProducts()
          const lowStock = await productService.getLowStockProducts()
          const expiring = await productService.getExpiringProducts()
          const orders = await orderService.getAllOrders()

          const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0)

          setStats({
            totalProducts: products.length,
            lowStockCount: lowStock.length,
            expiringCount: expiring.length,
            totalOrders: orders.length,
            totalSales,
          })
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

  const chartData = [
    { name: 'Jan', sales: 4000, orders: 40 },
    { name: 'Feb', sales: 3000, orders: 35 },
    { name: 'Mar', sales: 2000, orders: 20 },
    { name: 'Apr', sales: 2780, orders: 28 },
    { name: 'May', sales: 1890, orders: 19 },
    { name: 'Jun', sales: 2390, orders: 24 },
  ]

  const categoryData = [
    { name: 'Tablets', value: 400 },
    { name: 'Capsules', value: 300 },
    { name: 'Syrups', value: 200 },
    { name: 'Injections', value: 150 },
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your medicine management CRM</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600">{stats.expiringCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <Users className="h-8 w-8 text-primary opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
              <p className="text-2xl font-bold">₹{stats.totalSales.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sales & Orders Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#0088FE" />
              <Line type="monotone" dataKey="orders" stroke="#00C49F" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Daily Sales Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Sales Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
