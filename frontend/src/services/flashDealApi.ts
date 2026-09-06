import { getToken } from "./authApi";

const API_URL = "http://localhost:8000";

export interface FlashDealDto {
  id: number;
  product_id: number;
  product_name?: string;
  product_category?: string;
  product_image?: string | null;
  original_price: number;
  discount_percentage: number;
  deal_price: number;
  is_active: boolean;
  ends_at: string;
  hours_remaining?: number;
  product?: {
    id: number;
    name: string;
    category: string;
    price: number;
    image?: string;
    stock?: number;
  };
}

export interface FlashDealCreateDto {
  product_id: number;
  discount_percentage: number;
  deal_price?: number | null;
  is_active: boolean;
  ends_at: string;
}

/**
 * Public: Get Active Flash Deals for Homepage
 */
export async function getActiveFlashDeals(): Promise<FlashDealDto[]> {
  try {
    const res = await fetch(`${API_URL}/flash-deals/`);
    if (!res.ok) throw new Error("Failed to fetch active flash deals");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback deals", err);
    return [];
  }
}

/**
 * Admin: Get All Flash Deals
 */
export async function getAdminFlashDeals(): Promise<FlashDealDto[]> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const res = await fetch(`${API_URL}/flash-deals/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch flash deals for admin");
  }
  return await res.json();
}

/**
 * Admin: Create or Update Flash Deal
 */
export async function createAdminFlashDeal(data: FlashDealCreateDto): Promise<FlashDealDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const res = await fetch(`${API_URL}/flash-deals/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create flash deal");
  }
  return await res.json();
}

/**
 * Admin: Toggle Status
 */
export async function toggleAdminFlashDeal(dealId: number): Promise<FlashDealDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const res = await fetch(`${API_URL}/flash-deals/admin/${dealId}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to toggle flash deal");
  }
  return await res.json();
}

/**
 * Admin: Delete Flash Deal
 */
export async function deleteAdminFlashDeal(dealId: number): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const res = await fetch(`${API_URL}/flash-deals/admin/${dealId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete flash deal");
  }
}
