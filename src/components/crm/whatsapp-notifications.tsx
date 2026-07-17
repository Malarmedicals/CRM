'use client'

import { useState, useEffect } from 'react'
import { whatsappService, WhatsAppTemplate } from '@/features/crm'
import { notificationService } from '@/features/crm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, MessageSquare, Send, Search, MoreHorizontal, Eye, Copy, Play, Trash2, Calendar, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export default function WhatsAppNotifications() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'regular' | 'prescription' | 'highValue'>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('1')
  const [loading, setLoading] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [showSingleMessageDialog, setShowSingleMessageDialog] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await whatsappService.getWhatsAppTemplates()
      setTemplates(data)
    } catch (err: any) {
      // Ignore errors for sample templates
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

      await whatsappService.sendSegmentedMessage(
        targetSegment,
        template.message,
        {}
      )

      alert(`"${template.name}" WhatsApp campaign sent successfully to ${targetSegment} segment!`)
      setShowForm(false)
    } catch (err: any) {
      let errorMsg = err.message || 'Failed to send WhatsApp campaign'
      if (errorMsg.includes('131030') || errorMsg.includes('not in allowed list')) {
        errorMsg = 'Some recipient phone numbers are not in the allowed list. Please add them to your Meta Business Suite allowed list.'
      }
      setError(errorMsg)
      alert(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
      setSendingTemplateId(null)
    }
  }

  const handleSendSingleMessage = async () => {
    if (!phoneNumber || !message) {
      setError('Please enter both phone number and message')
      return
    }
    setLoading(true)
    setError('')
    try {
      await whatsappService.sendMessage(phoneNumber, message)
      alert('WhatsApp message sent successfully!')
      setShowSingleMessageDialog(false)
      setPhoneNumber('')
      setMessage('')
    } catch (err: any) {
      let errorMsg = err.message || 'Failed to send WhatsApp message'
      if (errorMsg.includes('131030') || errorMsg.includes('not in allowed list')) {
        errorMsg = 'Recipient phone number not in allowed list. Please add the number to your Meta Business Suite allowed list.'
      }
      setError(errorMsg)
      alert(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const sampleTemplates = [
    {
      id: '1',
      name: 'Order Confirmation',
      message: 'Hello! Your order #{{orderNumber}} has been confirmed. We will notify you once it\'s ready for pickup. Thank you for choosing Malar Medicals!',
      description: 'Send order confirmation to customers',
      status: 'Automated',
      lastSent: '2026-07-17T09:12:00Z',
      audience: 'Purchasers',
    },
    {
      id: '2',
      name: 'Prescription Reminder',
      message: 'Hi {{customerName}}! This is a reminder that your prescription for {{medicineName}} is due for refill. Visit us or call to renew. - Malar Medicals',
      description: 'Remind customers to refill prescriptions',
      status: 'Active',
      lastSent: '2026-07-16T14:30:00Z',
      audience: 'Prescription Customers',
    },
    {
      id: '3',
      name: 'Promotional Offer',
      message: '🎉 Special Offer! Get 20% off on all medicines this week. Use code SAVE20. Visit us today! - Malar Medicals',
      description: 'Send promotional offers to customers',
      status: 'Draft',
      lastSent: null,
      audience: 'All Customers',
    },
  ]

  const filteredTemplates = sampleTemplates.filter(t => 
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.message.toLowerCase().includes(searchTerm.toLowerCase())) &&
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">WhatsApp Campaigns</h2>
          <p className="text-slate-500 mt-1 text-sm">Design, schedule, and track your WhatsApp marketing communications.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showSingleMessageDialog} onOpenChange={setShowSingleMessageDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 bg-white gap-2">
                <Phone className="h-4 w-4" />
                Single Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send WhatsApp Message</DialogTitle>
                <DialogDescription>
                  Send a direct WhatsApp message to a single phone number.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Use international format (e.g. +91 for India)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowSingleMessageDialog(false)}>Cancel</Button>
                  <Button onClick={handleSendSingleMessage} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <MessageSquare className="h-4 w-4" />
                New WhatsApp Campaign
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
      </div>

      {/* Toolbar */}
      <Card className="p-4 shadow-sm border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search campaigns by name or message content..."
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
                <th className="px-4 py-3 font-medium">Message Body</th>
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
                  <td className="px-4 py-4 align-top max-w-[250px]">
                    <div className="text-slate-700 line-clamp-2" title={template.message}>{template.message}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-slate-600 text-sm flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3 text-slate-400" />
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
