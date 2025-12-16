import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pill, Truck, FileText, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { prescriptionService } from "@/features/prescriptions/prescription-service"
import { Prescription } from "@/lib/models/types"
import { formatDistanceToNow } from "date-fns"

interface WidgetProps {
    className?: string
}

interface ExpiringMedicine {
    name: string
    batch: string
    expiry: string
    stock: number
}

interface ExpiringMedicinesProps extends WidgetProps {
    medicines?: ExpiringMedicine[]
}

export function ExpiringMedicinesWidget({ className, medicines = [] }: ExpiringMedicinesProps) {
    return (
        <Card className={cn("border shadow-sm bg-card", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Expiring Soon
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {medicines.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No expiring medicines</p>
                    ) : (
                        medicines.map((med, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Pill className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{med.name}</p>
                                        <p className="text-xs text-muted-foreground">Batch: {med.batch}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-orange-600 bg-orange-500/10 border-orange-200 dark:border-orange-500/30 mb-1">
                                        {med.expiry}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">{med.stock} left</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function PendingApprovalsWidget({ className }: WidgetProps) {
    const [approvals, setApprovals] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Fetch only pending prescriptions
            const data = await prescriptionService.getAllPrescriptions('pending')
            setApprovals(data.slice(0, 5)) // Show max 5
        } catch (error) {
            console.error("Failed to load pending approvals", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={cn("border shadow-sm bg-card", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Pending Approvals
                </CardTitle>
                <div className="flex items-center gap-2">
                    {approvals.length > 0 && (
                        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-none">
                            {approvals.length} New
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadData}>
                        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                    ) : approvals.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
                    ) : (
                        approvals.map((item, i) => (
                            <Link href={`/dashboard/prescriptions/${item.id}`} key={item.id} className="block group">
                                <div className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group-hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Prescription</p>
                                            <p className="text-xs text-muted-foreground">{item.customerName || 'Unknown User'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }).replace('about ', '') : 'Just now'}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                <Link href="/dashboard/prescriptions">
                    <Button variant="outline" className="w-full mt-4 text-xs h-8 border-dashed text-muted-foreground hover:text-foreground">
                        View All Approvals
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

export function DeliveryPerformanceWidget({ className }: WidgetProps) {
    const agents = [
        { name: "Ramesh K.", status: "On Route", deliveries: 12, rating: 4.8 },
        { name: "Suresh M.", status: "Available", deliveries: 8, rating: 4.5 },
        { name: "Alex P.", status: "Busy", deliveries: 15, rating: 4.9 },
    ]

    return (
        <Card className={cn("border shadow-sm bg-card", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Truck className="h-4 w-4 text-teal-500" />
                    Delivery Agents
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {agents.map((agent, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-muted">
                                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                        {agent.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            agent.status === "On Route" ? "bg-blue-500" :
                                                agent.status === "Available" ? "bg-green-500" : "bg-orange-500"
                                        )} />
                                        <p className="text-xs text-muted-foreground">{agent.status}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground">{agent.deliveries}</p>
                                <p className="text-xs text-muted-foreground">Delivered</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
