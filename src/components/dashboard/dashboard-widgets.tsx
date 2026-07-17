import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pill, Truck, FileText, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { prescriptionService } from '@/features/prescriptions'
import type { Prescription } from '@/features/prescriptions/domain/types'
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
        <Card className={cn("border border-slate-200 shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Expiring Soon
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {medicines.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No expiring medicines</p>
                    ) : (
                        medicines.map((med, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                                        <Pill className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{med.name}</p>
                                        <p className="text-xs text-slate-500">Batch: {med.batch}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 mb-1">
                                        {med.expiry}
                                    </Badge>
                                    <p className="text-xs text-slate-500">{med.stock} left</p>
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
            const data = await prescriptionService.getPrescriptions('pending')
            setApprovals(data.slice(0, 5)) // Show max 5
        } catch (error) {
            console.error("Failed to load pending approvals", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className={cn("border border-slate-200 shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Pending Approvals
                </CardTitle>
                <div className="flex items-center gap-2">
                    {approvals.length > 0 && (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                            {approvals.length} New
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={loadData}>
                        <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {loading ? (
                        <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
                    ) : approvals.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No pending approvals</p>
                    ) : (
                        approvals.map((item, i) => (
                            <Link href={`/dashboard/prescriptions/${item.id}`} key={item.id} className="block group">
                                <div className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0 hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">Prescription</p>
                                            <p className="text-xs text-slate-500">{item.customerName || 'Unknown User'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }).replace('about ', '') : 'Just now'}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                <Link href="/dashboard/prescriptions">
                    <Button variant="outline" className="w-full mt-4 text-xs h-8 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
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
        <Card className={cn("border border-slate-200 shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
                    <Truck className="h-4 w-4 text-emerald-500" />
                    Delivery Agents
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {agents.map((agent, i) => (
                        <div key={i} className="flex items-center justify-between group p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-slate-100 border border-slate-200">
                                    <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                        {agent.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            agent.status === "On Route" ? "bg-blue-500" :
                                                agent.status === "Available" ? "bg-emerald-500" : "bg-amber-500"
                                        )} />
                                        <p className="text-xs text-slate-500">{agent.status}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{agent.deliveries}</p>
                                <p className="text-xs text-slate-500">Delivered</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
