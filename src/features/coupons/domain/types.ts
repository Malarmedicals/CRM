export interface Coupon {
  id: string;
  code: string;
  discount_amount?: number;
  discount_percentage?: number;
  min_order_value: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export type CreateCouponInput = Omit<Coupon, 'id' | 'created_at'>;
