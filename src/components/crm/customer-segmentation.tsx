'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/features/crm'
import { crmToolsService } from '@/features/crm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, AlertCircle, Mail, Search, MoreHorizontal, Eye, RefreshCw, Calendar, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface CustomerSegments {
  regular: string[]
  prescription: string[]
  highValue: string[]
}

export default function CustomerSegmentation() {
  const router = useRouter()
  const [segments, setSegments] = useState<CustomerSegments>({
    regular: [],
    prescription: [],
    highValue: [],
  })
  const [churnRisk, setChurnRisk] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadSegmentation()
  }, [])

  const loadSegmentation = async () => {
    try {
      const data = await notificationService.segmentCustomers()
      setSegments(data)

      const churnRiskCustomers = await crmToolsService.getChurnRiskCustomers()
      setChurnRisk(churnRiskCustomers)
    } catch (error) {
      console.error('Failed to load segmentation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTargetSegment = (segment: 'regular' | 'prescription' | 'highValue') => {
    // Navigate to email campaigns page with segment parameter
    router.push(`/dashboard/crm?tab=email-campaigns&segment=${segment}`)
  }

  const handleRetentionCampaign = async () => {
    try {
      await notificationService.sendBulkAlertNotification(
        churnRisk,
        'We Miss You!',
        'We noticed you haven\'t visited us in a while. Check out our latest offers and get 20% off your next order!',
        'promotion'
      )
      alert('Retention campaign sent successfully!')
    } catch (error) {
      console.error('Failed to send retention campaign:', error)
    }
  }

  const segmentData = [
    {
      id: 'regular',
      name: 'Regular Customers',
      description: 'Active customers with recent purchases',
      count: segments.regular.length,
      status: 'Active',
      icon: Users,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      rule: 'Purchased within 30 days'
    },
    {
      id: 'prescription',
      name: 'Prescription Customers',
      description: 'Customers with active prescription orders',
      count: segments.prescription.length,
      status: 'Active',
      icon: AlertCircle,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      rule: 'Has valid prescription on file'
    },
    {
      id: 'highValue',
      name: 'High-Value Customers',
      description: 'VIP customers ($1000+ lifetime spent)',
      count: segments.highValue.length,
      status: 'Active',
      icon: TrendingUp,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
      rule: 'LTV > $1000'
    },
    {
      id: 'churn',
      name: 'Churn Risk (Inactive)',
      description: 'No activity in the last 90 days',
      count: churnRisk.length,
      status: 'Warning',
      icon: AlertCircle,
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
      rule: 'No purchase in 90 days'
    }
  ]

  const filteredSegments = segmentData.filter(s => 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
      case 'Warning': return <Badge className="bg-red-50 text-red-700 border-red-200">Danger / Risk</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customer Segments</h2>
          <p className="text-slate-500 mt-1 text-sm">Create and manage dynamic groups of customers for targeted marketing.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200 bg-white gap-2" onClick={loadSegmentation} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Users className="h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-4 shadow-sm border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search segments by name or rule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warning">Warning / Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden shadow-sm border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 font-medium">Segment Name</th>
                <th className="px-4 py-3 font-medium">Definition Rule</th>
                <th className="px-4 py-3 font-medium text-center">Customer Count</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSegments.map((segment) => (
                <tr key={segment.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${segment.bgClass} ${segment.colorClass}`}>
                        <segment.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{segment.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{segment.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-slate-600 text-sm font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                      {segment.rule}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {loading ? '...' : segment.count}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {getStatusBadge(segment.status)}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Segment Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> View Customers</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-emerald-600 font-medium"
                          onClick={() => {
                            if (segment.id === 'churn') {
                              handleRetentionCampaign()
                            } else {
                              handleTargetSegment(segment.id as any)
                            }
                          }}
                          disabled={segment.count === 0}
                        >
                          <Mail className="h-4 w-4 mr-2" /> Target Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredSegments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No customer segments found matching your criteria.
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
