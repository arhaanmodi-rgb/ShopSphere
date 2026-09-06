import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

export const Wishlist: React.FC = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToBag = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  return (
    <div className="orders-page-wrapper">
      <div className="orders-header-row">
        <div className="orders-header-left">
          <div className="orders-title-group">
            <h1 className="orders-main-title">My Saved Wishlist</h1>
            <span className="orders-count-badge">
              {wishlist.length} {wishlist.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <p className="orders-subtitle">
            Saved items, limited-time price drops, and quick checkout
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="orders-header-actions">
            <button
              onClick={clearWishlist}
              className="btn-refresh-orders"
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
            >
              <span>🗑️</span>
              <span>Clear Wishlist</span>
            </button>
            <Link to="/" className="btn-hero-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
              Continue Shopping →
            </Link>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-orders-view">
          <span className="empty-orders-icon">💖</span>
          <h2 className="empty-orders-heading">Your Wishlist is Empty</h2>
          <p className="empty-orders-text">
            Explore our curated catalog of flagship electronics, streetwear fashion, and accessories. Click the heart icon on any product to save it here!
          </p>
          <Link to="/" className="btn-hero-primary">
            Explore 220+ Products →
          </Link>
        </div>
      ) : (
        <div className="products-grid-layout">
          {wishlist.map((product) => {
            const isOutOfStock = (product.stock ?? 25) <= 0;
            return (
              <article key={product.id} className="product-card-modern">
                <div className="card-badge-container">
                  <span className="category-pill">{product.category}</span>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="wishlist-heart-btn is-wishlisted"
                    title="Remove from wishlist"
                  >
                    ❤️
                  </button>
                </div>

                <Link to={`/product/${product.id}`} className="card-image-wrap">
                  <img src={product.image} alt={product.name} className="card-image" loading="lazy" />
                </Link>

                <div className="card-body">
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", marginBottom: "4px" }}>
                    🔥 Saved Item
                  </span>

                  <Link to={`/product/${product.id}`} className="card-title-link">
                    <h3 className="card-title">{product.name}</h3>
                  </Link>

                  <div className="card-footer-row" style={{ marginTop: "auto" }}>
                    <div className="price-block">
                      <span className="price-symbol">₹</span>
                      <span className="price-amount">{product.price.toLocaleString("en-IN")}</span>
                    </div>

                    <span className={`status-pill ${isOutOfStock ? "cancelled" : "delivered"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                      {isOutOfStock ? "Out of Stock" : "In Stock"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button
                      onClick={() => handleMoveToBag(product)}
                      disabled={isOutOfStock}
                      className="btn-add-to-cart"
                      style={{ flex: 1, padding: "8px 12px", fontSize: "12px", justifyContent: "center" }}
                    >
                      {isOutOfStock ? "Out of Stock" : "Move to Bag 🛒"}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="btn-delete-product-trash"
                      title="Remove"
                      style={{ padding: "8px 12px" }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
