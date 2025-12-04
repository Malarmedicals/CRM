'use client'

import { useState, useEffect } from 'react'
import { emailService, EmailTemplate } from '@/lib/services/email-service'
import { notificationService } from '@/lib/services/notification-service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, Mail, Send } from 'lucide-react'

export default function EmailCampaigns() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'regular' | 'prescription' | 'highValue'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await emailService.getEmailTemplates()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (templateId: string) => {
    setLoading(true)
    try {
      const template = templates.find((t) => t.id === templateId) || sampleTemplates.find((t) => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // For sample templates, we generate content and send directly
      if (sampleTemplates.find(t => t.id === templateId)) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>${template.name}</h1>
            <p>${template.description}</p>
            <hr />
            <p>This is a sample email campaign sent from Malar CRM.</p>
          </div>
        `
        await notificationService.sendSegmentedEmailDirect(
          selectedSegment,
          template.subject,
          htmlContent
        )
      } else {
        await notificationService.sendSegmentedEmail(
          selectedSegment as any,
          template.name,
          {}
        )
      }

      alert('Campaign sent successfully!')
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sampleTemplates = [
    {
      id: '1',
      name: 'Weekly Promotions',
      subject: 'Special Deals This Week!',
      description: 'Send weekly promotional offers to customers',
    },
    {
      id: '2',
      name: 'Prescription Reminder',
      subject: 'Time to Refill Your Prescription',
      description: 'Remind prescription customers to refill',
    },
    {
      id: '3',
      name: 'Welcome Email',
      subject: 'Welcome to Our Medicine Store',
      description: 'Welcome email for new customers',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage promotional and reminder emails</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Mail className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Send Campaign</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Template</label>
              <select className="w-full px-3 py-2 border border-input rounded-lg bg-background">
                {sampleTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Segment</label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              >
                <option value="all">All Customers</option>
                <option value="regular">Regular Customers</option>
                <option value="prescription">Prescription Customers</option>
                <option value="highValue">High-Value Customers</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSendCampaign('1')} disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send Campaign'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleTemplates.map((template) => (
          <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.subject}</p>
              </div>

              <p className="text-sm">{template.description}</p>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => handleSendCampaign(template.id)}
                disabled={loading}
              >
                <Send className="h-3 w-3" />
                {loading ? 'Sending...' : 'Send This Template'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
