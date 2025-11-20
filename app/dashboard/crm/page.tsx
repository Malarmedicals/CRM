'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmailCampaigns from '@/components/crm/email-campaigns'
import CustomerSegmentation from '@/components/crm/customer-segmentation'

export default function CRMToolsPage() {
  return (
    <Tabs defaultValue="campaigns" className="space-y-6">
      <TabsList>
        <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
        <TabsTrigger value="segmentation">Customer Segmentation</TabsTrigger>
      </TabsList>

      <TabsContent value="campaigns">
        <EmailCampaigns />
      </TabsContent>

      <TabsContent value="segmentation">
        <CustomerSegmentation />
      </TabsContent>
    </Tabs>
  )
}
