import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

function Navbar({ searchTerm = "", onSearchChange }: NavbarProps) {
  const { user, isAuthenticated, isAdmin, logoutUser } = useAuth();
  const { totalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported by your current browser. Please try Google Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        if (onSearchChange) {
          onSearchChange(spokenText);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Speech recognition failed to start", e);
      setIsListening(false);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo">
          <span className="brand-icon">🛍️</span>
          <span className="brand-text">
            Shop<span className="brand-highlight">Sphere</span>
          </span>
        </Link>

        {/* Search Bar with Voice Search */}
        <div className={`nav-search-bar ${isListening ? "is-voice-listening" : ""}`}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={isListening ? "Listening... Speak your query now" : "Search 200+ phones, laptops, apparel, footwear..."}
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="search-input-field"
          />

          {/* Voice Search Mic Button */}
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`voice-search-btn ${isListening ? "listening" : ""}`}
            title={isListening ? "Listening to your voice..." : "Search catalog with your voice"}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange && onSearchChange("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`nav-menu ${mobileMenuOpen ? "is-open" : ""}`}>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Explore
          </Link>

          {/* Non-admin links: Wishlist, Cart, and My Orders */}
          {!isAdmin && (
            <>
              {/* Wishlist Link */}
              <Link
                to="/wishlist"
                className="cart-nav-btn wishlist-nav-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="View Saved Wishlist"
              >
                <span className="cart-nav-icon">💖</span>
                <span className="cart-nav-label">Wishlist</span>
                {wishlistCount > 0 && <span className="cart-nav-badge wishlist-badge">{wishlistCount}</span>}
              </Link>

              {/* Cart Link with Badge */}
              <Link
                to="/cart"
                className="cart-nav-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="View Cart"
              >
                <span className="cart-nav-icon">🛒</span>
                <span className="cart-nav-label">Cart</span>
                {totalItems > 0 && <span className="cart-nav-badge">{totalItems}</span>}
              </Link>

              {/* My Orders for logged in customer */}
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className="nav-link flex items-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📦</span>
                  <span>My Orders</span>
                </Link>
              )}
            </>
          )}

          {/* Admin Dashboard button if admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition flex items-center gap-1.5 shadow-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>🛡️</span>
              <span>Admin Operations</span>
            </Link>
          )}

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="user-profile-menu">
              <div className="user-avatar-pill">
                <span className="user-avatar-icon">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="user-info-text">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-role-badge ${isAdmin ? "role-admin" : "role-member"}`}>
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="logout-nav-btn"
                title="Sign out of your account"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link
                to="/login"
                className="btn-signin"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-signup"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}

export default Navbar;