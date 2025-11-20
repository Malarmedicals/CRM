'use client'

import { useState, useEffect } from 'react'
import { leadService } from '@/lib/services/lead-service'
import { Lead } from '@/lib/models/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Edit, Trash } from 'lucide-react'
import LeadForm from './lead-form'

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<Lead['stage'] | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    let filtered = leads
    if (filterStage !== 'all') {
      filtered = filtered.filter((lead) => lead.stage === filterStage)
    }
    filtered = filtered.filter((lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredLeads(filtered)
  }, [searchTerm, filterStage, leads])

  const loadLeads = async () => {
    try {
      const data = await leadService.getAllLeads()
      setLeads(data)
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        // Delete implementation
        setLeads(leads.filter((l) => l.id !== id))
      } catch (error) {
        console.error('Failed to delete lead:', error)
      }
    }
  }

  const stageColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
  }

  const priorityColors = {
    low: 'text-gray-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer leads</p>
        </div>
        <Button
          onClick={() => {
            setEditingLead(null)
            setShowForm(true)
          }}
          className="gap-2"
        >
          <span>+ Add Lead</span>
        </Button>
      </div>

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={() => {
            setShowForm(false)
            setEditingLead(null)
          }}
          onSuccess={loadLeads}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2 bg-background border border-input rounded-lg px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value as any)}
          className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
        >
          <option value="all">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{lead.name}</h3>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${stageColors[lead.stage]}`}>
                    {lead.stage}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className={`font-semibold ${priorityColors[lead.priority]}`}>
                    {lead.priority}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-mono">{lead.phone}</p>
                </div>
              </div>

              {lead.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingLead(lead)
                    setShowForm(true)
                  }}
                  className="flex-1 gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(lead.id)}
                  className="flex-1 gap-1 text-destructive hover:text-destructive"
                >
                  <Trash className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No leads found</p>
        </Card>
      )}
    </div>
  )
}
