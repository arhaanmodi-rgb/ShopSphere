import { products as localProducts } from "../data/products";
import type { Product } from "../data/products";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type { Product };

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products/`);
    if (!response.ok) {
      return localProducts;
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return localProducts;
    }
    // Merge API data with images/ratings fallback if needed
    return data.map((item: Partial<Product>, idx: number) => {
      const fallback = localProducts.find((p) => p.id === item.id) || localProducts[idx % localProducts.length];
      return {
        id: item.id || idx + 1,
        name: item.name || fallback.name,
        category: item.category || fallback.category,
        price: Number(item.price) || fallback.price,
        image: item.image || fallback.image,
        rating: item.rating || fallback.rating || 4.8,
        reviewsCount: item.reviewsCount || fallback.reviewsCount || 120,
        description: item.description || fallback.description,
        stock: item.stock !== undefined ? item.stock : fallback.stock || 10,
        featured: item.featured !== undefined ? item.featured : fallback.featured,
      };
    });
  } catch {
    // Return fallback catalog if server is not reachable
    return localProducts;
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    if (response.ok) {
      const item = await response.json();
      const fallback = localProducts.find((p) => p.id === item.id) || localProducts[0];
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        image: item.image || fallback.image,
        rating: item.rating || fallback.rating || 4.8,
        reviewsCount: item.reviewsCount || fallback.reviewsCount || 120,
        description: item.description || fallback.description,
        stock: item.stock !== undefined ? item.stock : fallback.stock || 10,
        featured: item.featured !== undefined ? item.featured : fallback.featured,
      };
    }
  } catch {
    // ignore
  }

  const local = localProducts.find((p) => p.id === id);
  return local || null;
}