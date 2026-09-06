import type { Product } from "../data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}