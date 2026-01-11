'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/features/crm/notification-service'
import { crmToolsService } from '@/features/crm/crm-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, AlertCircle, Mail } from 'lucide-react'

interface CustomerSegments {
  regular: string[]
  prescription: string[]
  highValue: string[]
}

export default function CustomerSegmentation() {
  const router = useRouter()
  const [segments, setSegments] = useState<CustomerSegments>({
    regular: [],
    prescription: [],
    highValue: [],
  })
  const [churnRisk, setChurnRisk] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSegmentation()
  }, [])

  const loadSegmentation = async () => {
    try {
      const data = await notificationService.segmentCustomers()
      setSegments(data)

      const churnRiskCustomers = await crmToolsService.getChurnRiskCustomers()
      setChurnRisk(churnRiskCustomers)
    } catch (error) {
      console.error('Failed to load segmentation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTargetSegment = (segment: 'regular' | 'prescription' | 'highValue') => {
    // Navigate to email campaigns page with segment parameter
    router.push(`/dashboard/crm?tab=email-campaigns&segment=${segment}`)
  }

  const handleRetentionCampaign = async () => {
    try {
      await notificationService.sendBulkAlertNotification(
        churnRisk,
        'We Miss You!',
        'We noticed you haven\'t visited us in a while. Check out our latest offers and get 20% off your next order!',
        'promotion'
      )
      alert('Retention campaign sent successfully!')
    } catch (error) {
      console.error('Failed to send retention campaign:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Segmentation</h1>
        <p className="text-muted-foreground mt-1">Analyze and target customer segments</p>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Regular Customers</h3>
            <Users className="h-5 w-5 text-primary opacity-50" />
          </div>
          <p className="text-3xl font-bold">{segments.regular.length}</p>
          <p className="text-sm text-muted-foreground mt-2">Active customers with purchases</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
            onClick={() => handleTargetSegment('regular')}
            disabled={segments.regular.length === 0}
          >
            <Mail className="h-4 w-4" />
            Target This Segment
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Prescription Customers</h3>
            <AlertCircle className="h-5 w-5 text-orange-600 opacity-50" />
          </div>
          <p className="text-3xl font-bold">{segments.prescription.length}</p>
          <p className="text-sm text-muted-foreground mt-2">Customers with prescription orders</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
            onClick={() => handleTargetSegment('prescription')}
            disabled={segments.prescription.length === 0}
          >
            <Mail className="h-4 w-4" />
            Send Reminder
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">High-Value Customers</h3>
            <TrendingUp className="h-5 w-5 text-green-600 opacity-50" />
          </div>
          <p className="text-3xl font-bold">{segments.highValue.length}</p>
          <p className="text-sm text-muted-foreground mt-2">VIP customers ($1000+ spent)</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 gap-2"
            onClick={() => handleTargetSegment('highValue')}
            disabled={segments.highValue.length === 0}
          >
            <Mail className="h-4 w-4" />
            VIP Program
          </Button>
        </Card>
      </div>

      {/* Churn Risk Section */}
      <Card className="p-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Churn Risk Customers</h3>
            <p className="text-sm text-muted-foreground">No activity in last 90 days</p>
          </div>
          <span className="text-3xl font-bold text-orange-600">{churnRisk.length}</span>
        </div>
        <p className="text-sm mb-4">
          These customers haven't made a purchase recently. Consider sending them a retention offer.
        </p>
        <Button onClick={handleRetentionCampaign} className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Send Retention Campaign
        </Button>
      </Card>

      {/* Customer Health Metrics */}

    </div>
  )
}
