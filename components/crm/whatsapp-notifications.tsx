'use client'

import { useState, useEffect } from 'react'
import { whatsappService, WhatsAppTemplate } from '@/lib/services/whatsapp-service'
import { notificationService } from '@/lib/services/notification-service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, MessageSquare, Send, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function WhatsAppNotifications() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'regular' | 'prescription' | 'highValue'>('all')
  const [loading, setLoading] = useState(false)
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [showSingleMessageDialog, setShowSingleMessageDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('1')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await whatsappService.getWhatsAppTemplates()
      setTemplates(data)
    } catch (err: any) {
      // If no templates exist, that's okay - we'll use sample templates
      console.log('No WhatsApp templates found, using sample templates')
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

      console.log(`Sending WhatsApp template "${template.name}" (ID: ${templateId}) to segment: ${targetSegment}`)

      await whatsappService.sendSegmentedMessage(
        targetSegment,
        template.message,
        {}
      )

      alert(`"${template.name}" WhatsApp campaign sent successfully to ${targetSegment} segment!`)
      setShowForm(false)
    } catch (err: any) {
      console.error('Error sending WhatsApp campaign:', err)
      let errorMsg = err.message || 'Failed to send WhatsApp campaign'
      
      // Provide helpful message for allowed list error
      if (errorMsg.includes('131030') || errorMsg.includes('not in allowed list')) {
        errorMsg = 'Some recipient phone numbers are not in the allowed list. Please add them to your Meta Business Suite allowed list. Go to Meta Business Suite → WhatsApp → API Setup → Manage phone number list.'
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
      console.error('Error sending WhatsApp:', err)
      let errorMsg = err.message || 'Failed to send WhatsApp message'
      
      // Provide helpful message for allowed list error
      if (errorMsg.includes('131030') || errorMsg.includes('not in allowed list')) {
        errorMsg = 'Recipient phone number not in allowed list. Please add the number to your Meta Business Suite allowed list. Go to Meta Business Suite → WhatsApp → API Setup → Manage phone number list.'
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
    },
    {
      id: '2',
      name: 'Prescription Reminder',
      message: 'Hi {{customerName}}! This is a reminder that your prescription for {{medicineName}} is due for refill. Visit us or call to renew. - Malar Medicals',
      description: 'Remind customers to refill prescriptions',
    },
    {
      id: '3',
      name: 'Promotional Offer',
      message: '🎉 Special Offer! Get 20% off on all medicines this week. Use code SAVE20. Visit us today! - Malar Medicals',
      description: 'Send promotional offers to customers',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Notifications</h1>
          <p className="text-muted-foreground mt-1">Send WhatsApp messages to customers and segments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSingleMessageDialog} onOpenChange={setShowSingleMessageDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Send Single Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send WhatsApp Message</DialogTitle>
                <DialogDescription>
                  Send a WhatsApp message to a single phone number
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
                  <p className="text-xs text-muted-foreground">
                    Use international format: +919876543210 (India) or +1234567890
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    India format: +91 followed by 10 digits (e.g., +919876543210)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} characters
                  </p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowSingleMessageDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendSingleMessage} disabled={loading} className="gap-2">
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
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
              <Select defaultValue="1" onValueChange={(value) => setSelectedTemplateId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {sampleTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Segment</label>
              <Select value={selectedSegment} onValueChange={(value: any) => setSelectedSegment(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="regular">Regular Customers</SelectItem>
                  <SelectItem value="prescription">Prescription Customers</SelectItem>
                  <SelectItem value="highValue">High-Value Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleSendCampaign(selectedTemplateId, selectedSegment)} 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {sampleTemplates.map((template) => {
          const isSending = sendingTemplateId === template.id
          const isDisabled = loading && !isSending
          
          return (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{template.message}</p>
                </div>

                <p className="text-sm text-muted-foreground">{template.description}</p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Target Segment</label>
                    <Select
                      value={selectedSegment}
                      onValueChange={(value: any) => setSelectedSegment(value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        <SelectItem value="regular">Regular Customers</SelectItem>
                        <SelectItem value="prescription">Prescription Customers</SelectItem>
                        <SelectItem value="highValue">High-Value Customers</SelectItem>
                      </SelectContent>
                    </Select>
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

