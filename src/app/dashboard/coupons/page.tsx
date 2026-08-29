'use client'

import { useState, useEffect } from 'react'
import { couponRepository } from '@/features/coupons/infrastructure/coupon-repository'
import type { Coupon, CreateCouponInput } from '@/features/coupons/domain/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Tag, Calendar, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { CouponForm } from '@/features/coupons/components/coupon-form'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  
  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const data = await couponRepository.getAllCoupons()
      setCoupons(data)
    } catch (error) {
      console.error('Failed to load coupons:', error instanceof Error ? error.message : JSON.stringify(error))
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (data: CreateCouponInput) => {
    try {
      await couponRepository.createCoupon(data)
      toast.success('Coupon created successfully')
      setShowAddDialog(false)
      loadCoupons()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon')
    }
  }

  const handleUpdateCoupon = async (data: CreateCouponInput) => {
    if (!editingCoupon) return
    try {
      await couponRepository.updateCoupon(editingCoupon.id, data)
      toast.success('Coupon updated successfully')
      setEditingCoupon(null)
      loadCoupons()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update coupon')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    try {
      await couponRepository.deleteCoupon(id)
      toast.success('Coupon deleted')
      loadCoupons()
    } catch (error) {
      toast.error('Failed to delete coupon')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-[#00796b]" />
            Coupon Management
          </h1>
          <p className="text-slate-500 mt-1">Create and manage discount coupons for your store.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#00796b] hover:bg-[#00695c]">
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Tag className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p>No coupons found. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min. Order</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Expires At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {coupon.discount_amount ? (
                        <span className="flex items-center text-emerald-600 font-medium">
                          <IndianRupee className="h-3 w-3 mr-0.5" />{coupon.discount_amount}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">{coupon.discount_percentage}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">₹{coupon.min_order_value}</td>
                    <td className="px-6 py-4">
                      {coupon.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {coupon.expires_at ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(coupon.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingCoupon(coupon)}>
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Coupon</DialogTitle>
            <DialogDescription>Create a new discount code for your customers.</DialogDescription>
          </DialogHeader>
          <CouponForm onSubmit={handleCreateCoupon} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update details for {editingCoupon?.code}</DialogDescription>
          </DialogHeader>
          {editingCoupon && (
            <CouponForm 
              initialData={editingCoupon} 
              onSubmit={handleUpdateCoupon} 
              onCancel={() => setEditingCoupon(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
