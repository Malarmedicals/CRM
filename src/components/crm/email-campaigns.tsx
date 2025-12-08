'use client'

import { useState, useEffect } from 'react'
import { emailService, EmailTemplate } from '@/features/crm/email-service'
import { notificationService } from '@/features/crm/notification-service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertCircle, Mail, Send } from 'lucide-react'

export default function EmailCampaigns() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'regular' | 'prescription' | 'highValue'>('all')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('1')
  const [loading, setLoading] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
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

  const handleSendCampaign = async (templateId: string, segment?: 'all' | 'regular' | 'prescription' | 'highValue') => {
    setSendingTemplateId(templateId)
    setLoading(true)
    setError('')

    try {
      const template = templates.find((t) => t.id === templateId) || sampleTemplates.find((t) => t.id === templateId)
      if (!template) {
        throw new Error(`Template with ID "${templateId}" not found`)
      }

      // Use provided segment or default to selectedSegment
      const targetSegment = segment || selectedSegment

      console.log(`Sending template "${template.name}" (ID: ${templateId}) to segment: ${targetSegment}`)

      // For sample templates, we generate content and send directly
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
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              >
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
              <Button
                onClick={() => handleSendCampaign(selectedTemplateId)}
                disabled={loading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send Campaign'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleTemplates.map((template) => {
          const isSending = sendingTemplateId === template.id
          const isDisabled = loading && !isSending

          return (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>

                <p className="text-sm">{template.description}</p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Target Segment</label>
                    <select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value as any)}
                      className="w-full px-2 py-1 text-xs border border-input rounded bg-background"
                      disabled={loading}
                    >
                      <option value="all">All Customers</option>
                      <option value="regular">Regular Customers</option>
                      <option value="prescription">Prescription Customers</option>
                      <option value="highValue">High-Value Customers</option>
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleSendCampaign(template.id, selectedSegment)}
                    disabled={isDisabled}
                  >
                    <Send className="h-3 w-3" />
                    {isSending ? 'Sending...' : 'Send This Template'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
