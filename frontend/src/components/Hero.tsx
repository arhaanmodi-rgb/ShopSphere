interface HeroProps {
  onExploreClick?: () => void;
}

function Hero({ onExploreClick }: HeroProps) {
  const handleScrollToProducts = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const el = document.getElementById("shop-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="hero-modern">
      <div className="hero-modern-inner">
        <div className="hero-badge-pill">
          <span className="badge-sparkle">✨</span>
          <span>New Season Drops & Exclusive Deals</span>
        </div>

        <h1 className="hero-headline">
          The Future of Shopping, <br />
          <span className="hero-gradient-text">Crafted for You.</span>
        </h1>

        <p className="hero-subheading">
          Explore curated flagship technology, audio gear, and everyday essentials with lightning-fast delivery and verified buyer protection.
        </p>

        <div className="hero-actions-row">
          <button className="btn-hero-primary" onClick={handleScrollToProducts}>
            Explore Catalog <span>→</span>
          </button>
          <a href="#featured" className="btn-hero-secondary">
            View Trending
          </a>
        </div>

        {/* Value Prop Badges */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <span className="trust-icon">⚡</span>
            <div>
              <strong>Express Delivery</strong>
              <p>Free on orders above ₹999</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <div>
              <strong>Secure Payments</strong>
              <p>256-bit encrypted checkout</p>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🔄</span>
            <div>
              <strong>10-Day Return & Exchange</strong>
              <p>Doorstep pickup guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;