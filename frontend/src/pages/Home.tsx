import { useState, useMemo, useEffect } from "react";
import type { Product } from "../data/products";
import { products as initialProducts } from "../data/products";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { getActiveFlashDeals } from "../services/flashDealApi";
import type { FlashDealDto } from "../services/flashDealApi";

interface HomeProps {
  products: Product[];
  searchTerm: string;
}

function Home({ products, searchTerm }: HomeProps) {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  // Live Flash Deals from Admin
  const [flashDeals, setFlashDeals] = useState<FlashDealDto[]>([]);

  // Flash Sale Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 5,
    minutes: 42,
    seconds: 19,
  });

  useEffect(() => {
    async function loadDeals() {
      try {
        const data = await getActiveFlashDeals();
        if (data && data.length > 0) {
          setFlashDeals(data);
        }
      } catch (err) {
        console.error("Failed to load flash deals", err);
      }
    }
    loadDeals();
  }, []);

  // Update live ticking countdown clock
  useEffect(() => {
    const timer = setInterval(() => {
      if (flashDeals.length > 0 && flashDeals[0]?.ends_at) {
        const diffMs = new Date(flashDeals[0].ends_at).getTime() - Date.now();
        if (diffMs > 0) {
          const totalSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const minutes = Math.floor((totalSecs % 3600) / 60);
          const seconds = totalSecs % 60;
          setTimeLeft({ hours, minutes, seconds });
          return;
        }
      }

      // Fallback ticking clock
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [flashDeals]);

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...list];
  }, [products]);

  // Display deals: either from Admin API or fallback to first 4 products
  const displayFlashDeals = useMemo(() => {
    if (flashDeals.length > 0) {
      return flashDeals;
    }
    return products.slice(0, 4).map((p) => ({
      id: p.id,
      product_id: p.id,
      product_name: p.name,
      product_category: p.category,
      product_image: p.image,
      original_price: Math.round(p.price * 1.35),
      discount_percentage: 35,
      deal_price: p.price,
      is_active: true,
      ends_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      hours_remaining: 5,
    }));
  }, [flashDeals, products]);

  const handleGrabDeal = (deal: FlashDealDto) => {
    const matchedProduct = products.find((p) => p.id === deal.product_id);
    const productToAdd: Product = matchedProduct
      ? { ...matchedProduct, price: deal.deal_price }
      : {
          id: deal.product_id,
          name: deal.product_name || `Special Deal #${deal.product_id}`,
          category: deal.product_category || "Electronics",
          price: deal.deal_price,
          image: deal.product_image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
          description: `Limited Time Flash Deal Offer - ${deal.discount_percentage}% OFF!`,
          rating: 4.9,
          reviewsCount: 150,
          stock: 15,
        };
    addToCart(productToAdd, 1);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesPrice = product.price <= maxPrice;

      const matchesStock = !inStockOnly || (product.stock ?? 25) > 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, searchTerm, selectedCategory, maxPrice, inStockOnly, sortBy]);

  return (
    <div className="home-page-container">
      <Hero />

      {/* ============================================================ */}
      {/* FEATURE 7: FLASH DEALS & COUNTDOWN TIMER BANNER */}
      {/* ============================================================ */}
      <section className="flash-sale-banner-section">
        <div className="flash-sale-header-bar">
          <div className="flash-left-info">
            <span className="flash-flame-icon">🔥</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 className="flash-title">DEAL OF THE DAY</h3>
                <span className="flash-discount-tag">UP TO 40% OFF</span>
              </div>
              <p className="flash-subtitle">Admin Curated Limited-Time Deals & Special Pricing</p>
            </div>
          </div>

          {/* Synchronized Real-time Countdown Clock */}
          <div className="flash-timer-clock-box">
            <span className="timer-headline">⚡ Ends In:</span>
            <div className="countdown-digits-cluster">
              <div className="digit-card">
                <span className="digit-val">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="digit-label">HOURS</span>
              </div>
              <span className="digit-colon">:</span>
              <div className="digit-card">
                <span className="digit-val">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="digit-label">MINS</span>
              </div>
              <span className="digit-colon">:</span>
              <div className="digit-card">
                <span className="digit-val">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="digit-label">SECS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Deals Horizontal Carousel Cards */}
        <div className="flash-products-strip">
          {displayFlashDeals.map((deal) => {
            const matchedProduct = products.find((p) => p.id === deal.product_id) || initialProducts.find((p) => p.id === deal.product_id);
            const resolvedImage = deal.product_image || matchedProduct?.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80";
            const productName = deal.product_name || matchedProduct?.name || `Product #${deal.product_id}`;
            const productCat = deal.product_category || matchedProduct?.category || "Special Offer";

            return (
              <div key={deal.id || deal.product_id} className="flash-deal-card">
                <div className="flash-img-wrap">
                  <img
                    src={resolvedImage}
                    alt={productName}
                    className="flash-thumb"
                  />
                  <span className="flash-save-badge">SAVE {Math.round(deal.discount_percentage)}%</span>
                </div>
                <div className="flash-details">
                  <span className="flash-cat">{productCat}</span>
                  <h4 className="flash-product-name">{productName}</h4>
                  <div className="flash-price-row">
                    <span className="flash-current-price">₹{deal.deal_price.toLocaleString("en-IN")}</span>
                    <span className="flash-strikethrough">₹{deal.original_price.toLocaleString("en-IN")}</span>
                  </div>
                  <button
                    onClick={() => handleGrabDeal(deal)}
                    className="btn-flash-grab"
                    title="Quick add to bag at deal price"
                  >
                    Grab Deal ⚡
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* CATALOG SECTION WITH MULTI-FACET FILTER CONTROLS */}
      {/* ============================================================ */}
      <main id="shop-section" className="catalog-section">
        {/* Multi-Facet Filter Toolbar */}
        <div className="catalog-toolbar">
          <div className="category-pills-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-filter-btn ${
                  selectedCategory === cat ? "is-active" : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="multi-filter-controls-row">
            {/* Price Range Slider */}
            <div className="price-slider-filter-wrap">
              <span className="filter-chip-label">
                Max Price: <strong>₹{maxPrice.toLocaleString("en-IN")}</strong>
              </span>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-range-slider"
              />
            </div>

            {/* In-stock toggle */}
            <label className="in-stock-filter-toggle">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Dropdown */}
            <div className="sort-controls-wrap">
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "featured" | "price-asc" | "price-desc" | "rating"
                  )
                }
                className="sort-dropdown-select"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated ★</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="catalog-header-row">
          <div>
            <span className="section-eyebrow">PREMIUM SELECTION</span>
            <h2 className="section-main-title">
              {selectedCategory === "All"
                ? "All Products"
                : `${selectedCategory} Collection`}
            </h2>
          </div>
          <span className="results-count-pill">
            Showing {filteredAndSortedProducts.length} of {products.length} items
          </span>
        </div>

        {/* Product Grid or Empty State */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="empty-catalog-state">
            <span className="empty-icon">🔍</span>
            <h3>No products found</h3>
            <p>
              We couldn't find any items matching your filters.
              Try expanding your price range or resetting filters.
            </p>
            <button
              className="btn-clear-filters"
              onClick={() => {
                setSelectedCategory("All");
                setMaxPrice(100000);
                setInStockOnly(false);
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="products-grid-layout">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;