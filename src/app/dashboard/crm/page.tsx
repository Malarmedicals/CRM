'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmailCampaigns from '@/components/crm/email-campaigns'
import CustomerSegmentation from '@/components/crm/customer-segmentation'
import WhatsAppNotifications from '@/components/crm/whatsapp-notifications'

export default function CRMToolsPage() {
  return (
    <Tabs defaultValue="campaigns" className="space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 gap-1">
        <TabsTrigger value="campaigns" className="flex-1 min-w-[120px]">Email Campaigns</TabsTrigger>
        <TabsTrigger value="whatsapp" className="flex-1 min-w-[150px]">WhatsApp Notifications</TabsTrigger>
        <TabsTrigger value="segmentation" className="flex-1 min-w-[150px]">Customer Segmentation</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns">
        <EmailCampaigns />
      </TabsContent>

      <TabsContent value="whatsapp">
        <WhatsAppNotifications />
      </TabsContent>

      <TabsContent value="segmentation">
        <CustomerSegmentation />
      </TabsContent>
    </Tabs>
  )
}
