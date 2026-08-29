'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { Coupon, CreateCouponInput } from '../domain/types'

interface CouponFormProps {
  initialData?: Coupon
  onSubmit: (data: CreateCouponInput) => Promise<void>
  onCancel: () => void
}

export function CouponForm({ initialData, onSubmit, onCancel }: CouponFormProps) {
  const [formData, setFormData] = useState<CreateCouponInput>({
    code: initialData?.code || '',
    discount_amount: initialData?.discount_amount || undefined,
    discount_percentage: initialData?.discount_percentage || undefined,
    min_order_value: initialData?.min_order_value || 0,
    is_active: initialData?.is_active ?? true,
    expires_at: initialData?.expires_at || '',
  })

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        expires_at: formData.expires_at || undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="code">Coupon Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g. SUMMER20"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
          <Input
            id="discount_amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.discount_amount || ''}
            onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount_percentage">Discount %</Label>
          <Input
            id="discount_percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discount_percentage || ''}
            onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="e.g. 10"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">Provide either Discount Amount OR Discount %. If both are provided, Amount takes precedence.</p>

      <div className="space-y-2">
        <Label htmlFor="min_order_value">Minimum Order Value (₹) *</Label>
        <Input
          id="min_order_value"
          type="number"
          min="0"
          step="0.01"
          value={formData.min_order_value}
          onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at">Expiration Date</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Coupon'}
        </Button>
      </div>
    </form>
  )
}
