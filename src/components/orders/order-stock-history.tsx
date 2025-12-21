'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, TrendingDown, Calendar, User, FileText } from 'lucide-react'
import { inventoryService } from '@/features/products/inventory-service'
import { StockMovement } from '@/lib/models/types'

interface OrderStockHistoryProps {
    orderId: string
}

export function OrderStockHistory({ orderId }: OrderStockHistoryProps) {
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStockMovements()
    }, [orderId])

    const loadStockMovements = async () => {
        try {
            setLoading(true)
            const allMovements = await inventoryService.getStockMovements(undefined, 100)

            // Filter movements related to this order
            const orderMovements = allMovements.filter(
                m => m.orderId === orderId || m.reason.includes(orderId.substring(0, 8))
            )

            setMovements(orderMovements)
        } catch (error) {
            console.error('Failed to load stock movements:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Card>
        )
    }

    if (movements.length === 0) {
        return (
            <Card className="p-4">
                <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No stock movements found for this order</p>
                    <p className="text-xs mt-1">Stock will be reduced when order is marked as delivered</p>
                </div>
            </Card>
        )
    }

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'out':
                return 'bg-red-100 text-red-800 border-red-300'
            case 'in':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'adjustment':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'expired':
                return 'bg-orange-100 text-orange-800 border-orange-300'
            case 'returned':
                return 'bg-purple-100 text-purple-800 border-purple-300'
            case 'damaged':
                return 'bg-gray-100 text-gray-800 border-gray-300'
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300'
        }
    }

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'out':
                return '📤'
            case 'in':
                return '📥'
            case 'adjustment':
                return '⚙️'
            case 'expired':
                return '⏰'
            case 'returned':
                return '↩️'
            case 'damaged':
                return '⚠️'
            default:
                return '📦'
        }
    }

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Stock Movements for This Order</h3>
                <Badge variant="outline" className="ml-auto">
                    {movements.length} {movements.length === 1 ? 'movement' : 'movements'}
                </Badge>
            </div>

            <div className="space-y-3">
                {movements.map((movement) => (
                    <div
                        key={movement.id}
                        className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                {/* Product Name */}
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">
                                        {movement.productName}
                                    </span>
                                    <Badge className={`${getMovementTypeColor(movement.type)} border text-xs`}>
                                        {getMovementIcon(movement.type)} {movement.type.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* Quantity Change */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Quantity:</span>
                                        <span className={`font-semibold ${movement.type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                                            {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Stock:</span>
                                        <span className="font-mono text-xs">
                                            {movement.previousStock} → {movement.newStock}
                                        </span>
                                    </div>
                                </div>

                                {/* Reason */}
                                {movement.reason && (
                                    <div className="flex items-start gap-1 text-xs">
                                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                                        <span className="text-muted-foreground">{movement.reason}</span>
                                    </div>
                                )}

                                {/* Notes */}
                                {movement.notes && (
                                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        {movement.notes}
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {movement.timestamp ? new Date(movement.timestamp).toLocaleString('en-IN') : 'N/A'}
                                    </div>
                                    {movement.performedByName && (
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {movement.performedByName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
