import type { Product } from "../data/products";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

function ProductGrid({
  products,
  onAddToCart,
}: ProductGridProps) {

  return (
    <section className="products-section">

      <div className="section-heading">
        <p>OUR COLLECTION</p>
        <h2>Featured Products</h2>
      </div>

      {products.length === 0 ? (
        <p className="no-products">
          No products found.
        </p>
      ) : (
        <div className="product-grid">

          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}

        </div>
      )}

    </section>
  );
}

export default ProductGrid;