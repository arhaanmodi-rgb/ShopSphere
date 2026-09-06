import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { useWishlist } from "../context/WishlistContext";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  return (
    <article className="product-card-modern">
      {/* Category / Badge header */}
      <div className="card-badge-container">
        <span className="category-pill">{product.category}</span>
        {product.featured && <span className="badge-featured">Popular</span>}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`wishlist-heart-btn ${wishlisted ? "is-wishlisted" : ""}`}
          title={wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          {wishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Image with Link */}
      <Link to={`/product/${product.id}`} className="card-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="card-image"
          loading="lazy"
        />
      </Link>

      {/* Product Details */}
      <div className="card-body">
        {/* Rating */}
        <div className="card-rating-row">
          <span className="rating-star">★</span>
          <span className="rating-score">{product.rating || 4.8}</span>
          <span className="rating-count">({product.reviewsCount || 120})</span>
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`} className="card-title-link">
          <h3 className="card-title">{product.name}</h3>
        </Link>

        {/* Description snippet */}
        {product.description && (
          <p className="card-desc-snippet">{product.description}</p>
        )}

        {/* Price & Add to Cart */}
        <div className="card-footer-row">
          <div className="price-block">
            <span className="price-symbol">₹</span>
            <span className="price-amount">{product.price.toLocaleString("en-IN")}</span>
          </div>

          <button
            className="btn-add-to-cart"
            onClick={() => onAddToCart(product)}
            title={`Add ${product.name} to cart`}
          >
            <span className="cart-btn-icon">+</span>
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;