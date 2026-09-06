import { getToken } from "./authApi";

const API_URL = "http://localhost:8000";

export interface ReviewDto {
  id: number;
  product_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
}

export interface ProductReviewStatsDto {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<number, number>;
  reviews: ReviewDto[];
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment: string;
}

/**
 * Fetch reviews and ratings summary for a product
 */
export async function getProductReviews(productId: number): Promise<ProductReviewStatsDto> {
  const response = await fetch(`${API_URL}/reviews/product/${productId}`);
  if (!response.ok) {
    return {
      average_rating: 4.8,
      total_reviews: 0,
      rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      reviews: [],
    };
  }
  return response.json();
}

/**
 * Submit a customer product review
 */
export async function createProductReview(
  productId: number,
  payload: CreateReviewPayload
): Promise<ReviewDto> {
  const token = getToken();
  if (!token) throw new Error("Please sign in to write a review.");

  const response = await fetch(`${API_URL}/reviews/product/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to submit review.");
  }
  return data;
}
