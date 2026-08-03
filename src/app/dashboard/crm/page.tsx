'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import EmailCampaigns from '@/components/crm/email-campaigns'
import CustomerSegmentation from '@/components/crm/customer-segmentation'
import WhatsAppNotifications from '@/components/crm/whatsapp-notifications'
import EnquiriesDashboard from '@/components/crm/enquiries-dashboard'
import { BarChart3, Users, Mail, MessageSquare, Zap, Activity, Clock, TrendingUp, LayoutDashboard, Send, Calendar } from 'lucide-react'

export default function MarketingCenterPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-6 md:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marketing & CRM Center</h1>
        <p className="text-slate-500">Manage customer relationships, live customer enquiries, marketing campaigns, and engagement automations.</p>
      </div>

      <Tabs defaultValue="enquiries" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-white border border-slate-200 rounded-lg gap-1 shadow-sm">
          <TabsTrigger value="enquiries" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold">
            <MessageSquare className="h-4 w-4" /> Live Enquiries
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <Send className="h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <Users className="h-4 w-4" /> Segments
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <Zap className="h-4 w-4" /> Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-2 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ENQUIRIES TAB */}
        <TabsContent value="enquiries" className="space-y-6 outline-none">
          <EnquiriesDashboard />
        </TabsContent>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <Card className="p-4 shadow-sm border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Active Campaigns</span>
                <Send className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">12</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +2 from last week
              </div>
            </Card>

            <Card className="p-4 shadow-sm border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Messages Sent Today</span>
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">1,248</div>
              <div className="text-xs text-slate-500 mt-1">
                Email: 840 | WhatsApp: 408
              </div>
            </Card>

            <Card className="p-4 shadow-sm border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Active Segments</span>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">8</div>
              <div className="text-xs text-slate-500 mt-1">
                Targeting 15k+ customers
              </div>
            </Card>

            <Card className="p-4 shadow-sm border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Automations Running</span>
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">3</div>
              <div className="text-xs text-slate-500 mt-1">
                100% operational
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-400" /> Recent Activity
              </h3>
              <div className="space-y-4">
                {[
                  { text: 'Weekly Promotions email sent to All Customers', time: '2 hours ago', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { text: 'Prescription Reminder automated run completed', time: '5 hours ago', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { text: 'New Segment "High Value" created by Admin', time: '1 day ago', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { text: 'Order Confirmation WhatsApp sent to 45 users', time: '1 day ago', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-full ${act.bg}`}>
                      <act.icon className={`h-4 w-4 ${act.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">{act.text}</p>
                      <span className="text-xs text-slate-500">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 shadow-sm border-slate-200 bg-white">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" /> Upcoming Scheduled
              </h3>
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium">No upcoming campaigns</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  You don't have any campaigns scheduled for the future. Schedule a new email or WhatsApp campaign to see it here.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-12 outline-none">
          <EmailCampaigns />
          <hr className="border-slate-200" />
          <WhatsAppNotifications />
        </TabsContent>

        {/* SEGMENTATION TAB */}
        <TabsContent value="segmentation" className="outline-none">
          <CustomerSegmentation />
        </TabsContent>

        {/* AUTOMATION TAB (Placeholder) */}
        <TabsContent value="automation" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Marketing Automation</h2>
                <p className="text-slate-500 mt-1 text-sm">Build powerful, multi-step customer journeys.</p>
              </div>
            </div>
            
            <Card className="p-12 shadow-sm border-slate-200 bg-white flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automation Workflows Coming Soon</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Soon you will be able to build visual workflows that trigger emails, WhatsApp messages, and notifications based on customer behavior like abandoned carts or prescription uploads.
              </p>
              
              {/* Fake Workflow Preview */}
              <div className="flex flex-col items-center opacity-50 select-none pointer-events-none">
                <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 border border-slate-200 shadow-sm">
                  Customer Registers
                </div>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 shadow-sm">
                  Send Welcome Email
                </div>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 border border-slate-200 shadow-sm">
                  Wait 3 Days
                </div>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 shadow-sm">
                  Send WhatsApp Discount
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ANALYTICS TAB (Placeholder) */}
        <TabsContent value="analytics" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Analytics</h2>
                <p className="text-slate-500 mt-1 text-sm">Track engagement and revenue generated from your marketing efforts.</p>
              </div>
            </div>

            <Card className="p-12 shadow-sm border-slate-200 bg-white flex flex-col items-center justify-center text-center">
               <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics Dashboard Coming Soon</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Comprehensive reporting for open rates, click-through rates, conversions, and direct revenue attribution will be available here.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 select-none pointer-events-none">
               <Card className="p-4 shadow-sm border-slate-200 bg-white">
                  <div className="text-sm font-medium text-slate-500 mb-1">Avg. Email Open Rate</div>
                  <div className="text-2xl font-bold text-slate-900">24.8%</div>
               </Card>
               <Card className="p-4 shadow-sm border-slate-200 bg-white">
                  <div className="text-sm font-medium text-slate-500 mb-1">WhatsApp Delivery Rate</div>
                  <div className="text-2xl font-bold text-slate-900">98.2%</div>
               </Card>
               <Card className="p-4 shadow-sm border-slate-200 bg-white">
                  <div className="text-sm font-medium text-slate-500 mb-1">Marketing Attributed Revenue</div>
                  <div className="text-2xl font-bold text-slate-900">$12,450</div>
               </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
