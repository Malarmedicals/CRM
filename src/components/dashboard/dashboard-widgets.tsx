import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pill, Truck, FileText, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

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
        <Card className={cn("border-none shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Expiring Soon
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {medicines.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No expiring medicines</p>
                    ) : (
                        medicines.map((med, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-500 shadow-sm">
                                        <Pill className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{med.name}</p>
                                        <p className="text-xs text-slate-500">Batch: {med.batch}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-100 mb-1">
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
    const approvals = [
        { id: "#REQ-001", type: "Prescription", user: "John Doe", time: "10m ago" },
        { id: "#REQ-002", type: "Bulk Order", user: "City Hospital", time: "1h ago" },
        { id: "#REQ-003", type: "Return", user: "Sarah Smith", time: "2h ago" },
    ]

    return (
        <Card className={cn("border-none shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Pending Approvals
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">3 New</Badge>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {approvals.map((item, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{item.type}</p>
                                    <p className="text-xs text-slate-500">{item.user}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full mt-4 text-xs h-8 border-dashed">
                    View All Approvals
                </Button>
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
        <Card className={cn("border-none shadow-sm bg-white", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-teal-500" />
                    Delivery Agents
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {agents.map((agent, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-slate-100">
                                    <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                                        {agent.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            agent.status === "On Route" ? "bg-blue-500" :
                                                agent.status === "Available" ? "bg-green-500" : "bg-orange-500"
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

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
