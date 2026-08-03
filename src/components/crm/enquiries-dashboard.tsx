'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Search,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  Edit3,
  Package,
  Send,
  Check
} from 'lucide-react'

interface EnquiryData {
  id: string
  name: string
  email: string
  phone: string
  stage: 'new' | 'ongoing' | 'responded' | 'converted'
  priority: string
  notes: string
  customervalue?: string
  createdAt: Date
  parsedNotes?: {
    type?: 'product' | 'general'
    message?: string
    product?: {
      id: string
      name: string
      price?: number
    }
    sentAt?: string
    staffNotes?: string
  }
}

export default function EnquiriesDashboard() {
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([])
  const [filteredEnquiries, setFilteredEnquiries] = useState<EnquiryData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<'all' | 'new' | 'ongoing' | 'responded' | 'converted'>('all')
  const [filterType, setFilterType] = useState<'all' | 'product' | 'general'>('all')
  const [loading, setLoading] = useState(true)
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(null)
  const [staffNoteInput, setStaffNoteInput] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadEnquiries()
  }, [])

  useEffect(() => {
    let result = [...enquiries]

    if (filterStage !== 'all') {
      result = result.filter(e => e.stage === filterStage)
    }

    if (filterType !== 'all') {
      result = result.filter(e => {
        const type = e.parsedNotes?.type || 'general'
        return type === filterType
      })
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(e => {
        const name = (e.name || '').toLowerCase()
        const phone = (e.phone || '').toLowerCase()
        const msg = (e.parsedNotes?.message || '').toLowerCase()
        const prodName = (e.parsedNotes?.product?.name || '').toLowerCase()
        return name.includes(lower) || phone.includes(lower) || msg.includes(lower) || prodName.includes(lower)
      })
    }

    setFilteredEnquiries(result)
  }, [enquiries, filterStage, filterType, searchTerm])

  const loadEnquiries = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load enquiries:', error)
        return
      }

      const parsed: EnquiryData[] = (data || []).map((row: any) => {
        let parsedNotes: any = {}
        try {
          if (row.notes && row.notes.startsWith('{')) {
            parsedNotes = JSON.parse(row.notes)
          } else {
            parsedNotes = {
              type: row.customervalue === 'prescription' ? 'product' : 'general',
              message: row.notes || 'No message provided',
            }
          }
        } catch (e) {
          parsedNotes = {
            type: 'general',
            message: row.notes || ''
          }
        }

        return {
          id: row.id,
          name: row.name || 'Anonymous',
          email: row.email || '',
          phone: row.phone || '',
          stage: row.stage || 'new',
          priority: row.priority || 'medium',
          notes: row.notes || '',
          customervalue: row.customervalue,
          createdAt: new Date(row.created_at || Date.now()),
          parsedNotes
        }
      })

      setEnquiries(parsed)
    } catch (err) {
      console.error('Error in loadEnquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStage = async (id: string, newStage: 'new' | 'ongoing' | 'responded' | 'converted') => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('leads')
        .update({
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        alert('Error updating status: ' + error.message)
        return
      }

      setEnquiries(prev =>
        prev.map(e => (e.id === id ? { ...e, stage: newStage } : e))
      )
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, stage: newStage })
      }
    } catch (err) {
      console.error('Error updating stage:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const saveStaffNote = async () => {
    if (!selectedEnquiry) return
    try {
      setIsUpdating(true)
      const updatedNotesObj = {
        ...(selectedEnquiry.parsedNotes || {}),
        staffNotes: staffNoteInput.trim()
      }
      const updatedNotesStr = JSON.stringify(updatedNotesObj)

      const { error } = await supabase
        .from('leads')
        .update({
          notes: updatedNotesStr,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEnquiry.id)

      if (error) {
        alert('Error saving note: ' + error.message)
        return
      }

      setEnquiries(prev =>
        prev.map(e =>
          e.id === selectedEnquiry.id
            ? { ...e, notes: updatedNotesStr, parsedNotes: updatedNotesObj }
            : e
        )
      )
      setSelectedEnquiry(null)
      setStaffNoteInput('')
    } catch (err) {
      console.error('Error saving staff note:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteEnquiry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) {
        alert('Error deleting enquiry: ' + error.message)
        return
      }
      setEnquiries(prev => prev.filter(e => e.id !== id))
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null)
    } catch (err) {
      console.error('Error deleting enquiry:', err)
    }
  }

  const openWhatsAppReply = (e: EnquiryData) => {
    const phoneNum = e.phone.replace(/[^0-9]/g, '')
    const isProduct = e.parsedNotes?.type === 'product'
    const productName = e.parsedNotes?.product?.name
    const greeting = `Hello ${e.name}, greetings from Malar Medicals!\n\n`
    const bodyText = isProduct && productName
      ? `Regarding your product enquiry for "${productName}" (${e.parsedNotes?.product?.price ? '₹' + e.parsedNotes?.product?.price : ''}):\nWe have verified our inventory and would be glad to assist you with your order.`
      : `Regarding your recent enquiry: "${e.parsedNotes?.message || 'How can we help?'}":\nWe would love to help you with your requirement.`

    const fullMsg = encodeURIComponent(greeting + bodyText)
    window.open(`https://wa.me/91${phoneNum}?text=${fullMsg}`, '_blank')
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            New / Pending
          </span>
        )
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Ongoing
          </span>
        )
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Responded
          </span>
        )
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            {stage}
          </span>
        )
    }
  }

  const counts = {
    all: enquiries.length,
    new: enquiries.filter(e => e.stage === 'new').length,
    ongoing: enquiries.filter(e => e.stage === 'ongoing').length,
    responded: enquiries.filter(e => e.stage === 'responded').length,
    converted: enquiries.filter(e => e.stage === 'converted').length,
  }

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" /> Live Customer Enquiries
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Enquiries & Response Workflow
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage incoming inquiries, assign ongoing status, and reply directly via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadEnquiries}
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Stage Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { key: 'all', label: 'All Enquiries', count: counts.all },
            { key: 'new', label: 'New / Pending', count: counts.new },
            { key: 'ongoing', label: 'Ongoing / In Progress', count: counts.ongoing },
            { key: 'responded', label: 'Responded', count: counts.responded },
            { key: 'converted', label: 'Resolved / Converted', count: counts.converted },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStage(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                filterStage === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  filterStage === tab.key
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-800 font-bold'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Type Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by customer, phone, medicine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-300 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-500 uppercase">Type:</span>
            {[
              { key: 'all', label: 'All Types' },
              { key: 'product', label: 'Product Enquiries' },
              { key: 'general', label: 'General Enquiries' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setFilterType(t.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === t.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enquiries List / Cards */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading enquiries from live CRM database...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Enquiries Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm || filterStage !== 'all' || filterType !== 'all'
              ? 'Try resetting your search or filter tabs to see more records.'
              : 'When website visitors send product or general enquiries, they will appear here live.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEnquiries.map(enquiry => {
            const isProduct = enquiry.parsedNotes?.type === 'product'
            const product = enquiry.parsedNotes?.product

            return (
              <div
                key={enquiry.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left Section: Customer Info & Enquiry Type */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isProduct
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isProduct ? (
                      <Package className="w-6 h-6" />
                    ) : (
                      <MessageSquare className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {enquiry.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          isProduct
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isProduct ? 'Product Enquiry' : 'General Enquiry'}
                      </span>
                      {getStageBadge(enquiry.stage)}
                    </div>

                    {/* Phone & Date */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        {enquiry.phone}
                      </span>
                      <span>•</span>
                      <span>
                        Sent: {new Date(enquiry.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Product box (if product enquiry) */}
                    {isProduct && product && (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 my-2 inline-flex items-center gap-3">
                        <span className="text-xs font-bold text-emerald-800">
                          Medicine: {product.name}
                        </span>
                        {product.price && (
                          <span className="text-xs font-semibold text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message box */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-500 text-xs uppercase block mb-1">
                        Customer Message:
                      </span>
                      &ldquo;{enquiry.parsedNotes?.message || 'No message left'}&rdquo;
                    </div>

                    {/* Staff Notes if any */}
                    {enquiry.parsedNotes?.staffNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 mt-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">
                          Internal Staff Notes:
                        </span>
                        {enquiry.parsedNotes.staffNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex flex-wrap lg:flex-col items-stretch lg:items-end gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  {/* WhatsApp Reply Button */}
                  <Button
                    onClick={() => openWhatsAppReply(enquiry)}
                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    WhatsApp Reply
                  </Button>

                  {/* Stage Quick Movers */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {enquiry.stage === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStage(enquiry.id, 'ongoing')}
                        className="text-xs font-semibold border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100"
                        disabled={isUpdating}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" /> Mark Ongoing
                      </Button>
                    )}

                    {(enquiry.stage === 'new' || enquiry.stage === 'ongoing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStage(enquiry.id, 'responded')}
                        className="text-xs font-semibold border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-100"
                        disabled={isUpdating}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Responded
                      </Button>
                    )}

                    {enquiry.stage !== 'converted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStage(enquiry.id, 'converted')}
                        className="text-xs font-semibold border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100"
                        disabled={isUpdating}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                      </Button>
                    )}
                  </div>

                  {/* Note & Delete */}
                  <div className="flex items-center gap-2 justify-end mt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedEnquiry(enquiry)
                        setStaffNoteInput(enquiry.parsedNotes?.staffNotes || '')
                      }}
                      className="text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Notes
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEnquiry(enquiry.id)}
                      className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Staff Notes Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Staff Notes for {selectedEnquiry.name}
              </h3>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <strong>Phone:</strong> {selectedEnquiry.phone}
              </p>
              <p>
                <strong>Stage:</strong> {selectedEnquiry.stage}
              </p>
              <p>
                <strong>Message:</strong> &ldquo;
                {selectedEnquiry.parsedNotes?.message || ''}&rdquo;
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Internal Staff Response / Log Notes:
              </label>
              <textarea
                value={staffNoteInput}
                onChange={(e) => setStaffNoteInput(e.target.value)}
                placeholder="e.g., Called customer, confirmed Dolo 650 is in stock. Delivery scheduled for tomorrow."
                className="w-full h-28 p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEnquiry(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveStaffNote}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Notes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
