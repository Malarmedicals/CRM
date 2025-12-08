'use client'

import { useState } from 'react'
import { Lead } from '@/lib/models/types'
import { leadService } from '@/features/crm/lead-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface LeadFormProps {
  lead?: Lead | null
  onClose: () => void
  onSuccess: () => void
}

export default function LeadForm({ lead, onClose, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Lead>>(
    lead || {
      name: '',
      email: '',
      phone: '',
      stage: 'new',
      priority: 'medium',
      notes: '',
    }
  )
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (lead?.id) {
        await leadService.updateLead(lead.id, formData as Partial<Lead>)
      } else {
        await leadService.createLead(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save lead:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <Input
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              placeholder="Lead name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <Input
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              placeholder="Phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stage</label>
            <select
              name="stage"
              value={formData.stage || 'new'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority || 'medium'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            placeholder="Add any notes about this lead..."
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Lead'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
