'use client'

import { useState, useEffect } from 'react'
import { inventoryService } from '@/features/products'
import type { Product, StockMovement } from '@/features/products/domain/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Plus, Minus, Edit, History, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { usePermissions } from '@/components/auth/permission-provider'

export default function InventoryPage() {
    const { hasPermission } = usePermissions()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<string>('all')

    // Stock adjustment dialog
    const [showAdjustDialog, setShowAdjustDialog] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in')
    const [adjustmentQuantity, setAdjustmentQuantity] = useState('')
    const [adjustmentReason, setAdjustmentReason] = useState('')
    const [adjustmentNotes, setAdjustmentNotes] = useState('')

    // Stock movement history dialog
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([])

    // Stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        expiringSoonCount: 0,
    })

    useEffect(() => {
        loadInventory()
    }, [])

    useEffect(() => {
        filterProducts()
    }, [searchTerm, products, filterType])

    const loadInventory = async () => {
        try {
            setLoading(true)
            const [productsData, statsData] = await Promise.all([
                inventoryService.getAllProducts(),
                inventoryService.getInventoryStats(),
            ])
            setProducts(productsData)
            setStats(statsData)
        } catch (error) {
            console.error('Failed to load inventory:', error)
            toast.error('Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    const filterProducts = () => {
        let filtered = [...products]

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            filtered = filtered.filter((product) =>
                product.name.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search) ||
                product.batchNumber?.toLowerCase().includes(search)
            )
        }

        // Apply type filter
        if (filterType === 'low-stock') {
            filtered = filtered.filter(p => {
                const minLevel = p.minStockLevel || 10
                return p.stockQuantity <= minLevel && p.stockQuantity > 0
            })
        } else if (filterType === 'out-of-stock') {
            filtered = filtered.filter(p => p.stockQuantity === 0)
        } else if (filterType === 'expiring') {
            const thresholdDate = new Date()
            thresholdDate.setDate(thresholdDate.getDate() + 30)
            filtered = filtered.filter(p => {
                if (!p.expiryDate) return false
                const expiryDate = new Date(p.expiryDate)
                return expiryDate <= thresholdDate && expiryDate >= new Date()
            })
        }

        setFilteredProducts(filtered)
    }

    const handleAdjustStock = (product: Product) => {
        setSelectedProduct(product)
        setAdjustmentType('in')
        setAdjustmentQuantity('')
        setAdjustmentReason('')
        setAdjustmentNotes('')
        setShowAdjustDialog(true)
    }

    const handleSaveAdjustment = async () => {
        if (!selectedProduct || !adjustmentQuantity || !adjustmentReason) {
            toast.error('Please fill in all required fields')
            return
        }

        const quantity = parseInt(adjustmentQuantity)
        if (isNaN(quantity) || quantity <= 0) {
            toast.error('Please enter a valid quantity')
            return
        }

        try {
            await inventoryService.updateStock(
                selectedProduct.id,
                quantity,
                adjustmentType,
                adjustmentReason,
                adjustmentNotes
            )

            toast.success('Stock updated successfully')
            setShowAdjustDialog(false)
            await loadInventory()
        } catch (error) {
            console.error('Failed to update stock:', error)
            toast.error('Failed to update stock')
        }
    }

    const handleViewHistory = async (product: Product) => {
        setSelectedProduct(product)
        try {
            const movements = await inventoryService.getStockMovements(product.id, 20)
            setStockMovements(movements)
            setShowHistoryDialog(true)
        } catch (error) {
            console.error('Failed to load history:', error)
            toast.error('Failed to load stock history')
        }
    }

    const getStockStatusColor = (product: Product) => {
        if (product.stockQuantity === 0) return 'text-red-700 bg-red-50'
        const minLevel = product.minStockLevel || 10
        if (product.stockQuantity <= minLevel) return 'text-amber-700 bg-amber-50'
        return 'text-emerald-700 bg-emerald-50'
    }

    const getStockStatusLabel = (product: Product) => {
        if (product.stockQuantity === 0) return 'Out of Stock'
        const minLevel = product.minStockLevel || 10
        if (product.stockQuantity <= minLevel) return 'Low Stock'
        return 'In Stock'
    }

    const getExpiryStatus = (expiryDate: Date) => {
        const date = new Date(expiryDate)
        const today = new Date()
        const daysUntilExpiry = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) return { label: 'Expired', color: 'text-red-600' }
        if (daysUntilExpiry <= 30) return { label: `Expires in ${daysUntilExpiry} days`, color: 'text-red-600' }
        if (daysUntilExpiry <= 90) return { label: `Expires in ${daysUntilExpiry} days`, color: 'text-amber-600' }
        
        const months = Math.floor(daysUntilExpiry / 30)
        return { label: `~${months} months left`, color: 'text-slate-600' }
    }

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Inventory Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Track and manage your medical inventory.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="p-5 shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Products</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
                </Card>

                <Card className="p-5 shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Inventory Units</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalItems.toLocaleString()}</p>
                </Card>

                <Card className="p-5 shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <span className="text-lg">💰</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600">Value</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.totalValue.toLocaleString()}</p>
                </Card>

                <Card className="p-5 shadow-sm border-amber-200 bg-amber-50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-sm font-medium text-amber-800">Low Stock</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-800">{stats.lowStockCount}</p>
                </Card>

                <Card className="p-5 shadow-sm border-red-200 bg-red-50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <p className="text-sm font-medium text-red-800">Out of Stock</p>
                    </div>
                    <p className="text-2xl font-bold text-red-800">{stats.outOfStockCount}</p>
                </Card>

                <Card className="p-5 shadow-sm border-orange-200 bg-orange-50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">{stats.expiringSoonCount}</p>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2 flex-1 w-full px-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by product name, category, or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 px-0 text-slate-900 placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-[180px] border-0 bg-transparent shadow-none focus:ring-0 h-8 text-slate-700 font-medium">
                            <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Inventory</SelectItem>
                            <SelectItem value="low-stock">Low Stock</SelectItem>
                            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                            <SelectItem value="expiring">Expiring Soon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Products List - Desktop Table & Mobile Cards */}
            <div className="space-y-4">
                {/* Desktop View */}
                <Card className="hidden md:block overflow-hidden shadow-sm border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 whitespace-nowrap">Product</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Category</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Stock</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Expiry</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-right">Price</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((product) => {
                                    const expiryStatus = product.expiryDate ? getExpiryStatus(product.expiryDate) : null

                                    return (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-slate-50/80 transition-colors bg-white group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {product.primaryImage ? (
                                                        <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                                            <img src={product.primaryImage} alt={product.name} className="h-full w-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 shrink-0 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200">
                                                            <Package className="h-5 w-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-900 leading-none">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-xs text-slate-500">{product.brandName || 'Unknown Brand'}</span>
                                                            {product.batchNumber && (
                                                                <>
                                                                    <span className="text-xs text-slate-300">•</span>
                                                                    <span className="text-xs text-slate-500 font-mono" title="Batch/SKU">{product.batchNumber}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal">
                                                    {product.category || 'Uncategorized'}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-semibold text-sm ${product.stockQuantity === 0 ? 'text-red-600' : product.minStockLevel && product.stockQuantity <= product.minStockLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                                                        {product.stockQuantity} <span className="font-normal text-xs text-slate-500">Units</span>
                                                    </span>
                                                    {product.minStockLevel && (
                                                        <span className="text-[11px] text-slate-400 mt-0.5">Min: {product.minStockLevel}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`${getStockStatusColor(product)} font-medium border-0 px-2 py-1`}>
                                                    {getStockStatusLabel(product)}
                                                </Badge>
                                            </td>

                                            <td className="px-6 py-4">
                                                {expiryStatus ? (
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${expiryStatus.color}`}>
                                                            {expiryStatus.label}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 mt-0.5">
                                                            {new Date(product.expiryDate!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">Not tracked</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium text-sm text-slate-900">₹{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {hasPermission('inventory.adjust_stock') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleAdjustStock(product)}
                                                            title="Adjust Stock"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('inventory.view_history') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                            onClick={() => handleViewHistory(product)}
                                                            title="View History"
                                                        >
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredProducts.map((product) => {
                        const expiryStatus = product.expiryDate ? getExpiryStatus(product.expiryDate) : null
                        return (
                            <Card key={product.id} className="p-5 border-slate-200 bg-white shadow-sm">
                                <div className="flex gap-4 mb-4">
                                    {product.primaryImage ? (
                                        <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                            <img src={product.primaryImage} alt={product.name} className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 shrink-0 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200">
                                            <Package className="h-6 w-6 text-slate-300" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-base text-slate-900 leading-tight mb-1">{product.name}</h3>
                                                <p className="text-sm text-slate-500">{product.brandName || 'Unknown Brand'}</p>
                                            </div>
                                            <Badge variant="outline" className={`${getStockStatusColor(product)} font-medium border-0 px-2 py-0.5 whitespace-nowrap ml-2 text-[10px]`}>
                                                {getStockStatusLabel(product)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Category</p>
                                        <span className="font-medium text-slate-900">{product.category || 'Uncategorized'}</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Stock</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${product.stockQuantity === 0 ? 'text-red-600' : product.minStockLevel && product.stockQuantity <= product.minStockLevel ? 'text-amber-600' : 'text-slate-900'}`}>
                                                {product.stockQuantity} <span className="font-normal text-xs text-slate-500">Units</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Price</p>
                                        <span className="font-medium text-slate-900">₹{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs mb-1">Batch / SKU</p>
                                        <span className="font-mono text-slate-700">{product.batchNumber || '-'}</span>
                                    </div>
                                    {expiryStatus && (
                                        <div className="col-span-2 pt-2 border-t border-slate-200 mt-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-slate-500 text-xs">Expiry</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className={`h-3 w-3 ${expiryStatus.color}`} />
                                                    <span className={`text-xs font-medium ${expiryStatus.color}`}>
                                                        {expiryStatus.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {hasPermission('inventory.adjust_stock') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-9 text-blue-600 border-blue-200 hover:bg-blue-50 bg-white"
                                            onClick={() => handleAdjustStock(product)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Adjust
                                        </Button>
                                    )}
                                    {hasPermission('inventory.view_history') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-9 text-slate-700 border-slate-200 hover:bg-slate-50 bg-white"
                                            onClick={() => handleViewHistory(product)}
                                        >
                                            <History className="h-4 w-4 mr-2" />
                                            History
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {filteredProducts.length === 0 && !loading && (
                <Card className="p-12 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center shadow-none">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Package className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Try adjusting your search or filters to find what you're looking for.
                    </p>
                </Card>
            )}

            {/* Stock Adjustment Dialog */}
            <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
                        <DialogDescription>
                            Current stock: {selectedProduct?.stockQuantity || 0} units
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Adjustment Type</label>
                            <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-green-600" />
                                            Add Stock (Stock In)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="out">
                                        <div className="flex items-center gap-2">
                                            <Minus className="h-4 w-4 text-red-600" />
                                            Remove Stock (Stock Out)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="adjustment">
                                        <div className="flex items-center gap-2">
                                            <Edit className="h-4 w-4 text-blue-600" />
                                            Manual Adjustment
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Quantity</label>
                            <Input
                                type="number"
                                placeholder="Enter quantity"
                                value={adjustmentQuantity}
                                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Reason *</label>
                            <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {adjustmentType === 'in' && (
                                        <>
                                            <SelectItem value="new-stock">New Stock Received</SelectItem>
                                            <SelectItem value="return">Customer Return</SelectItem>
                                            <SelectItem value="recount">Stock Recount</SelectItem>
                                        </>
                                    )}
                                    {adjustmentType === 'out' && (
                                        <>
                                            <SelectItem value="sold">Sold/Dispatched</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="damaged">Damaged</SelectItem>
                                            <SelectItem value="lost">Lost/Missing</SelectItem>
                                        </>
                                    )}
                                    {adjustmentType === 'adjustment' && (
                                        <>
                                            <SelectItem value="audit">Stock Audit</SelectItem>
                                            <SelectItem value="correction">Data Correction</SelectItem>
                                            <SelectItem value="migration">System Migration</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                            <Textarea
                                placeholder="Add additional notes..."
                                value={adjustmentNotes}
                                onChange={(e) => setAdjustmentNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAdjustment}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stock Movement History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Stock Movement History - {selectedProduct?.name}</DialogTitle>
                        <DialogDescription>
                            Recent stock movements for this product
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-4">
                        {stockMovements.map((movement) => (
                            <Card key={movement.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {movement.type === 'in' && <Plus className="h-4 w-4 text-green-600" />}
                                            {movement.type === 'out' && <Minus className="h-4 w-4 text-red-600" />}
                                            {movement.type === 'adjustment' && <Edit className="h-4 w-4 text-blue-600" />}
                                            {(movement.type === 'expired' || movement.type === 'damaged') && <AlertTriangle className="h-4 w-4 text-orange-600" />}

                                            <span className="font-medium text-sm capitalize">{movement.type}</span>
                                            <Badge variant="outline" className="text-xs">{movement.reason}</Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Quantity:</span>
                                                <span className="ml-1 font-medium">{movement.quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Previous:</span>
                                                <span className="ml-1 font-medium">{movement.previousStock}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">New:</span>
                                                <span className="ml-1 font-medium">{movement.newStock}</span>
                                            </div>
                                        </div>

                                        {movement.notes && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Note: {movement.notes}
                                            </p>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-2">
                                            By: {movement.performedByName} • {new Date(movement.timestamp).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {stockMovements.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No stock movements found</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
