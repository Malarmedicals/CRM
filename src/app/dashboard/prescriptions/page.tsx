'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { prescriptionService } from '@/features/prescriptions'
import type { Prescription } from '@/features/prescriptions/domain/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, RefreshCw, Calendar, User, Eye, CheckCircle, Clock, XCircle, FileText, Download, MoreHorizontal, FilePlus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

export default function PrescriptionsPage() {
    const router = useRouter()
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')

    useEffect(() => {
        loadPrescriptions()
        const interval = setInterval(loadPrescriptions, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!Array.isArray(prescriptions)) {
            setFilteredPrescriptions([])
            return
        }

        const search = String(searchTerm || '').toLowerCase()
        let filtered = prescriptions.filter((p) => {
            if (!p) return false
            const id = String(p.id || '').toLowerCase()
            const customer = String(p.customerName || '').toLowerCase()
            const phone = String(p.customerPhone || '').toLowerCase()
            const matchesSearch = id.includes(search) || customer.includes(search) || phone.includes(search)

            if (statusFilter === 'all') return matchesSearch
            return matchesSearch && p.status === statusFilter
        })
        setFilteredPrescriptions(filtered)
    }, [searchTerm, prescriptions, statusFilter])

    const loadPrescriptions = async () => {
        setLoading(true)
        try {
            const data = await prescriptionService.getPrescriptions()
            setPrescriptions(data)
        } catch (error) {
            console.error('Failed to load prescriptions:', error)
            toast.error('Failed to load prescriptions')
        } finally {
            setLoading(false)
        }
    }

    const getStatusConfig = (status: Prescription['status']) => {
        const variants: Record<string, { label: string; badgeClass: string; icon: any }> = {
            pending: { label: 'Pending Review', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
            verifying: { label: 'In Review', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
            approved: { label: 'Approved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
            rejected: { label: 'Rejected', badgeClass: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
            ordered: { label: 'Ordered', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle },
        }
        return variants[status] || variants.pending
    }

    const navigateToVerification = (id: string) => {
        router.push(`/dashboard/prescriptions/${id}`)
    }

    const statusCounts = {
        all: prescriptions.length,
        pending: prescriptions.filter(p => p.status === 'pending').length,
        approved: prescriptions.filter(p => p.status === 'approved').length,
        rejected: prescriptions.filter(p => p.status === 'rejected').length,
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 p-6 md:p-8 bg-slate-50 min-h-screen">
            {/* Row 1: Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Prescription Management
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Review and manage uploaded customer prescriptions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Row 2: KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Prescriptions', count: statusCounts.all, icon: FileText, color: 'text-slate-600' },
                    { label: 'Pending Review', count: statusCounts.pending, icon: Clock, color: 'text-amber-600' },
                    { label: 'Approved', count: statusCounts.approved, icon: CheckCircle, color: 'text-emerald-600' },
                    { label: 'Rejected', count: statusCounts.rejected, icon: XCircle, color: 'text-red-600' },
                ].map((kpi, idx) => (
                    <Card key={idx} className="p-4 shadow-sm border-slate-200 bg-white flex flex-col justify-between h-24 transition-shadow hover:shadow-md cursor-default">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                            <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{kpi.count}</span>
                    </Card>
                ))}
            </div>

            {/* Row 3: Unified Search & Filter Toolbar */}
            <Card className="p-4 shadow-sm border-slate-200 bg-white">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by ID, Customer Name, or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 border-slate-200"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="verifying">In Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="ordered">Ordered</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Row 4: Prescription Table */}
            <Card className="overflow-hidden shadow-sm border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date Uploaded</th>
                                <th className="px-4 py-3 font-medium">Customer</th>
                                <th className="px-4 py-3 font-medium">Customer Notes</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Pharmacist</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPrescriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No prescriptions found</p>
                                            <p className="text-xs text-slate-400 max-w-sm">
                                                There are currently no prescriptions matching your filters. When customers upload prescriptions, they will appear here.
                                            </p>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSearchTerm('')
                                                setStatusFilter('all')
                                            }}>Reset Filters</Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPrescriptions.map((p) => {
                                    const statusConfig = getStatusConfig(p.status)
                                    const StatusIcon = statusConfig.icon
                                    const isPending = p.status === 'pending'

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* Date Uploaded */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-slate-900">
                                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                    <span>{p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                    {p.medicationNotes?.uploadType === 'list' || p.fileType === 'text/plain' ? (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 leading-tight bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider">List</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 leading-tight bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-wider">File</Badge>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                                        {(p.customerName || 'G').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{p.customerName || 'Guest'}</div>
                                                        <div className="text-xs text-slate-500">{p.customerPhone || 'No Phone'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Customer Notes */}
                                            <td className="px-4 py-3 align-top max-w-[200px]">
                                                {p.medicationNotes?.customerNotes ? (
                                                    <div className="text-slate-600 truncate text-sm" title={p.medicationNotes.customerNotes}>
                                                        {p.medicationNotes.customerNotes}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">-</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 align-top">
                                                <Badge variant="outline" className={`${statusConfig.badgeClass} rounded-full border flex items-center gap-1 w-fit`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusConfig.label}
                                                </Badge>
                                            </td>

                                            {/* Pharmacist */}
                                            <td className="px-4 py-3 align-top">
                                                {p.pharmacistName ? (
                                                    <div className="flex items-start gap-2 text-slate-700">
                                                        <User className="h-4 w-4 mt-0.5 text-slate-400" />
                                                        <span className="text-sm">{p.pharmacistName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">-</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 align-top text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 group-hover:bg-white">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Prescription Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => navigateToVerification(p.id)}
                                                            className={isPending ? "text-emerald-600 font-medium" : ""}
                                                        >
                                                            {isPending ? (
                                                                <><Eye className="h-4 w-4 mr-2" /> Review Prescription</>
                                                            ) : (
                                                                <><FileText className="h-4 w-4 mr-2" /> View Details</>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
