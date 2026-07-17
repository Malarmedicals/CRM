'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { emailService, EmailTemplate } from '@/features/crm'
import { notificationService } from '@/features/crm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, Mail, Send, Search, MoreHorizontal, Eye, Copy, Play, Trash2, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function EmailCampaigns() {
  const searchParams = useSearchParams()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'regular' | 'prescription' | 'highValue'>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('1')
  const [loading, setLoading] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTemplates()
    const segmentParam = searchParams.get('segment') as 'all' | 'regular' | 'prescription' | 'highValue' | null
    if (segmentParam) {
      setSelectedSegment(segmentParam)
      setShowForm(true) // Open the form automatically if coming from segment target
    }
  }, [searchParams])

  const loadTemplates = async () => {
    try {
      const data = await emailService.getEmailTemplates()
      setTemplates(data)
    } catch (err: any) {
      // Ignore errors for sample templates
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (templateId: string, segment?: 'all' | 'regular' | 'prescription' | 'highValue') => {
    setSendingTemplateId(templateId)
    setLoading(true)
    setError('')

    try {
      const template = templates.find((t) => t.id === templateId) || sampleTemplates.find((t) => t.id === templateId)
      if (!template) {
        throw new Error(`Template with ID "${templateId}" not found`)
      }

      const targetSegment = segment || selectedSegment

      if (sampleTemplates.find(t => t.id === templateId)) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">${template.name}</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">${template.description}</p>
              <hr style="border: none; border-top: 2px solid #eee; margin: 30px 0;" />
              <p style="color: #333; font-size: 14px; line-height: 1.6;">This is a sample email campaign sent from Malar CRM.</p>
              <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Malar Medicals. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
        await notificationService.sendSegmentedEmailDirect(
          targetSegment,
          template.subject,
          htmlContent
        )
      } else {
        await notificationService.sendSegmentedEmail(
          targetSegment as any,
          template.name,
          {}
        )
      }

      alert(`"${template.name}" campaign sent successfully to ${targetSegment} segment!`)
      setShowForm(false)
    } catch (err: any) {
      console.error('Error sending campaign:', err)
      setError(err.message || 'Failed to send campaign')
      alert(`Error: ${err.message || 'Failed to send campaign'}`)
    } finally {
      setLoading(false)
      setSendingTemplateId(null)
    }
  }

  const sampleTemplates = [
    {
      id: '1',
      name: 'Weekly Promotions',
      subject: 'Special Deals This Week!',
      description: 'Send weekly promotional offers to customers',
      status: 'Active',
      lastSent: '2026-07-15T10:30:00Z',
      audience: 'All Customers',
    },
    {
      id: '2',
      name: 'Prescription Reminder',
      subject: 'Time to Refill Your Prescription',
      description: 'Remind prescription customers to refill',
      status: 'Automated',
      lastSent: '2026-07-17T08:00:00Z',
      audience: 'Prescription Customers',
    },
    {
      id: '3',
      name: 'Welcome Email',
      subject: 'Welcome to Our Medicine Store',
      description: 'Welcome email for new customers',
      status: 'Automated',
      lastSent: '2026-07-17T11:15:00Z',
      audience: 'New Customers',
    },
    {
      id: '4',
      name: 'Re-engagement Offer',
      subject: 'We Miss You! 20% Off Inside',
      description: 'Retention campaign for churn risk customers',
      status: 'Draft',
      lastSent: null,
      audience: 'Inactive Customers',
    }
  ]

  const filteredTemplates = sampleTemplates.filter(t => 
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
      case 'Automated': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Automated</Badge>
      case 'Draft': return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Email Campaigns</h2>
          <p className="text-slate-500 mt-1 text-sm">Design, schedule, and track your email marketing campaigns.</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Mail className="h-4 w-4" />
              New Email Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Select a template and target audience to launch your campaign.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Target Audience</Label>
                <Select value={selectedSegment} onValueChange={(val: any) => setSelectedSegment(val)}>
                  <SelectTrigger id="segment">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="regular">Regular Customers</SelectItem>
                    <SelectItem value="prescription">Prescription Customers</SelectItem>
                    <SelectItem value="highValue">High-Value Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button 
                  onClick={() => handleSendCampaign(selectedTemplateId, selectedSegment)}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Launch Campaign'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {searchParams.get('segment') && !showForm && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            <strong>Targeting selected from Segments: </strong>
            {searchParams.get('segment') === 'regular' && 'Regular Customers'}
            {searchParams.get('segment') === 'prescription' && 'Prescription Customers'}
            {searchParams.get('segment') === 'highValue' && 'High-Value Customers'}
            {searchParams.get('segment') === 'all' && 'All Customers'}
            . Click "New Email Campaign" to proceed.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <Card className="p-4 shadow-sm border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search campaigns by name or subject..."
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
                <SelectItem value="automated">Automated</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
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
                <th className="px-4 py-3 font-medium">Campaign Name</th>
                <th className="px-4 py-3 font-medium">Subject Line</th>
                <th className="px-4 py-3 font-medium">Audience</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Sent</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-slate-900">{template.name}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {template.id}</div>
                  </td>
                  <td className="px-4 py-4 align-top max-w-[200px]">
                    <div className="text-slate-700 truncate" title={template.subject}>{template.subject}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-slate-600 text-sm flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {template.audience}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {getStatusBadge(template.status)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {template.lastSent ? (
                      <div className="text-slate-600 text-sm flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(template.lastSent).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-emerald-600 font-medium"
                          onClick={() => {
                            setSelectedTemplateId(template.id)
                            setShowForm(true)
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" /> Launch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No campaigns found matching your criteria.
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
