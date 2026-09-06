import { getToken } from "./authApi";

const API_URL = "http://localhost:8000";

export interface CouponDto {
  id: number;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_amount: number;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface CouponValidateResult {
  valid: boolean;
  code: string;
  discount_type?: "percentage" | "flat";
  discount_value?: number;
  calculated_discount: number;
  min_order_amount: number;
  valid_until?: string;
  hours_remaining?: number;
  is_expiring_soon: boolean;
  message: string;
}

export interface CreateCouponPayload {
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order_amount: number;
  valid_until: string;
  is_active?: boolean;
}

/**
 * Fetch all publicly active unexpired coupons
 */
export async function getActiveCoupons(): Promise<CouponDto[]> {
  const response = await fetch(`${API_URL}/coupons/active`);
  if (!response.ok) return [];
  return response.json();
}

/**
 * Validate coupon code against cart amount
 */
export async function validateCoupon(code: string, order_amount: number): Promise<CouponValidateResult> {
  const response = await fetch(`${API_URL}/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, order_amount }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return {
      valid: false,
      code,
      calculated_discount: 0,
      min_order_amount: 0,
      is_expiring_soon: false,
      message: data.detail || "Failed to validate promo code.",
    };
  }

  return response.json();
}

/**
 * Admin: Fetch all coupons
 */
export async function getAdminCoupons(): Promise<CouponDto[]> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/coupons/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to load admin coupons.");
  return response.json();
}

/**
 * Admin: Create new coupon
 */
export async function createAdminCoupon(payload: CreateCouponPayload): Promise<CouponDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/coupons/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to create coupon.");
  return data;
}

/**
 * Admin: Toggle coupon active status
 */
export async function toggleAdminCoupon(couponId: number): Promise<CouponDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/coupons/admin/${couponId}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update coupon.");
  return data;
}

/**
 * Admin: Delete coupon
 */
export async function deleteAdminCoupon(couponId: number): Promise<{ message: string; id: number }> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/coupons/admin/${couponId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to delete coupon.");
  return data;
}
