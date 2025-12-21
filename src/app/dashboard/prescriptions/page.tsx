'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { prescriptionService } from '@/features/prescriptions/prescription-service'
import { Prescription } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw, Calendar, User, Eye, CheckCircle, Clock, XCircle, FileText } from 'lucide-react'
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
            const data = await prescriptionService.getAllPrescriptions()
            setPrescriptions(data)
        } catch (error) {
            console.error('Failed to load prescriptions:', error)
            toast.error('Failed to load prescriptions')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: Prescription['status']) => {
        const variants: Record<string, { label: string; className: string; icon: any }> = {
            pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
            verifying: { label: 'In Review', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
            approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
            rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
            ordered: { label: 'Ordered', className: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle },
        }
        const config = variants[status] || variants.pending
        const Icon = config.icon
        return (
            <Badge className={`${config.className} border text-xs flex items-center gap-1 w-fit`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        )
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        📑 Prescription Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Review and digitize customer prescriptions
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadPrescriptions} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Status Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                    >
                        All <Badge className="ml-2 bg-white text-black">{statusCounts.all}</Badge>
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending <Badge className="ml-2 bg-yellow-500">{statusCounts.pending}</Badge>
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('approved')}
                    >
                        Approved <Badge className="ml-2 bg-green-500">{statusCounts.approved}</Badge>
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Rejected <Badge className="ml-2 bg-red-500">{statusCounts.rejected}</Badge>
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-4 w-full md:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search ID, Name, Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 bg-transparent min-w-[250px]"
                    />
                </div>
            </div>

            {/* List */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b">
                            <tr className="text-left text-xs font-semibold uppercase">
                                <th className="p-4 whitespace-nowrap">Date Uploaded</th>
                                <th className="p-4 whitespace-nowrap">Customer</th>
                                <th className="p-4 whitespace-nowrap">Customer Notes</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Pharmacist</th>
                                <th className="p-4 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrescriptions.map((p, index) => (
                                <tr
                                    key={p.id}
                                    className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'
                                        }`}
                                >
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-start gap-2">
                                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">{p.customerName || 'Unknown User'}</p>
                                                <p className="text-xs text-muted-foreground">{p.customerPhone || 'No Phone'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {p.medicationNotes?.customerNotes ? (
                                            <div className="max-w-xs">
                                                <p className="text-sm text-blue-700 truncate" title={p.medicationNotes.customerNotes}>
                                                    {p.medicationNotes.customerNotes}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(p.status)}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm text-muted-foreground">
                                            {p.pharmacistName || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            size="sm"
                                            onClick={() => navigateToVerification(p.id)}
                                            className="gap-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {p.status === 'pending' ? 'Review' : 'View Details'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPrescriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No prescriptions found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
