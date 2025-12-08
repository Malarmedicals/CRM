'use client'

import { useState, useEffect } from 'react'
import { inventoryService } from '@/features/products/inventory-service'
import { Product, StockMovement } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Plus, Minus, Edit, History, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

export default function InventoryPage() {
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
        if (product.stockQuantity === 0) return 'text-red-600 bg-red-50'
        const minLevel = product.minStockLevel || 10
        if (product.stockQuantity <= minLevel) return 'text-yellow-600 bg-yellow-50'
        return 'text-green-600 bg-green-50'
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
        if (daysUntilExpiry <= 30) return { label: `${daysUntilExpiry} days`, color: 'text-red-600' }
        if (daysUntilExpiry <= 60) return { label: `${daysUntilExpiry} days`, color: 'text-yellow-600' }
        return { label: `${daysUntilExpiry} days`, color: 'text-green-600' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        📦 Inventory Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your medical inventory
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadInventory} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground">Total Products</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-muted-foreground">Total Items</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</p>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💰</span>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                    </div>
                    <p className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</p>
                </Card>

                <Card className="p-4 border-yellow-200 bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-xs text-yellow-800 font-medium">Low Stock</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-800">{stats.lowStockCount}</p>
                </Card>

                <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <p className="text-xs text-red-800 font-medium">Out of Stock</p>
                    </div>
                    <p className="text-2xl font-bold text-red-800">{stats.outOfStockCount}</p>
                </Card>

                <Card className="p-4 border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <p className="text-xs text-orange-800 font-medium">Expiring Soon</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">{stats.expiringSoonCount}</p>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-2 bg-background border border-input rounded-lg px-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products by name, category, or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 bg-transparent"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                    >
                        All Products
                    </Button>
                    <Button
                        variant={filterType === 'low-stock' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('low-stock')}
                    >
                        Low Stock
                    </Button>
                    <Button
                        variant={filterType === 'out-of-stock' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('out-of-stock')}
                    >
                        Out of Stock
                    </Button>
                    <Button
                        variant={filterType === 'expiring' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('expiring')}
                    >
                        Expiring Soon
                    </Button>
                </div>
            </div>

            {/* Products List - Desktop Table & Mobile Cards */}
            <div className="space-y-4">
                {/* Desktop View */}
                <Card className="hidden md:block overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left text-xs font-semibold uppercase">
                                    <th className="p-4 whitespace-nowrap">Product</th>
                                    <th className="p-4 whitespace-nowrap">Category</th>
                                    <th className="p-4 whitespace-nowrap">Batch</th>
                                    <th className="p-4 whitespace-nowrap">Stock</th>
                                    <th className="p-4 whitespace-nowrap">Status</th>
                                    <th className="p-4 whitespace-nowrap">Expiry</th>
                                    <th className="p-4 whitespace-nowrap">Price</th>
                                    <th className="p-4 whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, index) => {
                                    const expiryStatus = product.expiryDate ? getExpiryStatus(product.expiryDate) : null

                                    return (
                                        <tr
                                            key={product.id}
                                            className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}
                                        >
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-sm">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{product.brandName || 'N/A'}</p>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                            </td>

                                            <td className="p-4">
                                                <p className="text-xs font-mono">{product.batchNumber || 'N/A'}</p>
                                            </td>

                                            <td className="p-4">
                                                <div>
                                                    <p className="font-semibold text-sm">{product.stockQuantity}</p>
                                                    {product.minStockLevel && (
                                                        <p className="text-xs text-muted-foreground">Min: {product.minStockLevel}</p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <Badge className={`${getStockStatusColor(product)} border text-xs`}>
                                                    {getStockStatusLabel(product)}
                                                </Badge>
                                            </td>

                                            <td className="p-4">
                                                {expiryStatus ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span className={`text-xs font-medium ${expiryStatus.color}`}>
                                                            {expiryStatus.label}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">N/A</span>
                                                )}
                                            </td>

                                            <td className="p-4">
                                                <p className="font-semibold text-sm">₹{product.price}</p>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-xs h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleAdjustStock(product)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Adjust
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-xs h-7 px-2"
                                                        onClick={() => handleViewHistory(product)}
                                                    >
                                                        <History className="h-3 w-3" />
                                                        History
                                                    </Button>
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
                            <Card key={product.id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-base">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">{product.brandName || 'N/A'}</p>
                                    </div>
                                    <Badge className={`${getStockStatusColor(product)} border text-xs`}>
                                        {getStockStatusLabel(product)}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Category</p>
                                        <Badge variant="outline" className="mt-1">{product.category}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Stock</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{product.stockQuantity} units</p>
                                            {product.minStockLevel && product.stockQuantity <= product.minStockLevel && (
                                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Price</p>
                                        <p className="font-medium">₹{product.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Batch</p>
                                        <p className="font-mono">{product.batchNumber || '-'}</p>
                                    </div>
                                    {expiryStatus && (
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground text-xs">Expiry</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span className={`font-medium ${expiryStatus.color}`}>
                                                    {expiryStatus.label}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 border-t pt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => handleAdjustStock(product)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Adjust
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() => handleViewHistory(product)}
                                    >
                                        <History className="h-4 w-4 mr-2" />
                                        History
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {filteredProducts.length === 0 && !loading && (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No products found</p>
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
