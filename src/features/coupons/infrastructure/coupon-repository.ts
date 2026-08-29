import { supabase } from '@/lib/supabase/client';
import type { Coupon, CreateCouponInput } from '../domain/types';

export const couponRepository = {
  async getAllCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createCoupon(input: CreateCouponInput): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        ...input,
        code: input.code.toUpperCase(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCoupon(id: string, updates: Partial<CreateCouponInput>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
