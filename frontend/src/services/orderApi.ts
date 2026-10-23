import { getToken } from "./authApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface OrderItemDto {
  id: number;
  product_id: number | null;
  product_name?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface OrderDto {
  id: number;
  user_id: number;
  user_email?: string;
  user_name?: string;
  total_amount: number;
  status: string;
  items: OrderItemDto[];
  created_at?: string;
  delivered_at?: string;
  shipping_address?: string;
  payment_method?: string;
  return_exchange_type?: string;
  return_exchange_reason?: string;
  can_cancel?: boolean;
  hours_left_to_cancel?: number;
  can_return_exchange?: boolean;
  days_left_to_return?: number;
}

export interface AdminStats {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  shipped_orders: number;
  out_for_delivery_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_products: number;
  total_users: number;
}

export interface CreateOrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  shipping_address?: string;
  payment_method?: string;
}

export interface ReturnExchangePayload {
  type: "return" | "exchange";
  reason: string;
  comments?: string;
}

/**
 * Creates a new order for the currently logged-in user.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<OrderDto> {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to place an order.");
  }

  const response = await fetch(`${API_URL}/orders/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e: { msg?: string }) => e.msg || "").join(", ")
        : "Failed to place order.";
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Fetches all orders belonging to the logged-in customer.
 */
export async function getMyOrders(): Promise<OrderDto[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Please log in to view your orders.");
  }

  const response = await fetch(`${API_URL}/orders/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load orders.");
  }

  return data;
}

/**
 * Customer: Cancel order within 24 hours of placement.
 */
export async function cancelOrder(orderId: number): Promise<OrderDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Please log in to cancel your order.");
  }

  const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to cancel order.");
  }

  return data;
}

/**
 * Customer: Request return or exchange within 10 days of delivery.
 */
export async function requestReturnExchange(orderId: number, payload: ReturnExchangePayload): Promise<OrderDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Please log in to request return or exchange.");
  }

  const response = await fetch(`${API_URL}/orders/${orderId}/return-exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to submit return/exchange request.");
  }

  return data;
}

/**
 * Admin: Fetches all orders across all users in the system.
 */
export async function getAdminOrders(): Promise<OrderDto[]> {
  const token = getToken();
  if (!token) {
    throw new Error("Admin authorization required.");
  }

  const response = await fetch(`${API_URL}/admin/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load admin orders.");
  }

  return data;
}

/**
 * Admin: Updates order status (e.g. pending, shipped, out_for_delivery, delivered, cancelled)
 */
export async function updateOrderStatus(orderId: number, status: string): Promise<OrderDto> {
  const token = getToken();
  if (!token) {
    throw new Error("Admin authorization required.");
  }

  const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update order status.");
  }

  return data;
}

/**
 * Admin: Retrieves platform stats & KPIs.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const token = getToken();
  if (!token) {
    throw new Error("Admin authorization required.");
  }

  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch admin stats.");
  }

  return data;
}

export interface AdminProductDto {
  id: number;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
}

/**
 * Admin: Fetch all products from DB
 */
export async function getAdminProducts(): Promise<AdminProductDto[]> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to fetch products.");
  return data;
}

/**
 * Admin: Add new product to DB
 */
export async function createAdminProduct(payload: CreateProductPayload): Promise<AdminProductDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to create product.");
  return data;
}

/**
 * Admin: Toggle or update stock quantity
 */
export async function updateAdminProductStock(productId: number, stock_quantity: number): Promise<AdminProductDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products/${productId}/stock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stock_quantity }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update stock.");
  return data;
}

/**
 * Admin: Update product price
 */
export async function updateAdminProductPrice(productId: number, price: number): Promise<AdminProductDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ price }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update product price.");
  return data;
}

/**
 * Admin: Update product details
 */
export async function updateAdminProduct(
  productId: number,
  payload: { name?: string; category?: string; price?: number; stock_quantity?: number }
): Promise<AdminProductDto> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update product.");
  return data;
}

/**
 * Admin: Delete product
 */
export async function deleteAdminProduct(productId: number): Promise<{ message: string; id: number }> {
  const token = getToken();
  if (!token) throw new Error("Admin authorization required.");

  const response = await fetch(`${API_URL}/admin/products/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to delete product.");
  return data;
}
