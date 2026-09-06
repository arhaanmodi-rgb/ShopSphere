import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { getProducts } from "./services/productApi";
import type { Product } from "./services/productApi";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./components/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { MyOrders } from "./pages/MyOrders";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Wishlist } from "./pages/Wishlist";

// Toast Notification Sub-component
function GlobalToast() {
  const { toast, dismissToast } = useCart();
  if (!toast) return null;

  return (
    <div className="global-toast-banner" onClick={dismissToast}>
      <span className="toast-icon">🛍️</span>
      <span className="toast-text">{toast}</span>
      <button className="toast-close-btn" onClick={dismissToast}>
        ✕
      </button>
    </div>
  );
}

// App Layout Inner
function AppLayout() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="app-viewport">
      <GlobalToast />

      {/* Modern Top Header */}
      <Navbar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Main Content Router */}
      <main className="main-content-flow">
        {loading ? (
          <div className="global-page-loader">
            <div className="loading-spinner-ring"></div>
            <p>Loading ShopSphere catalog...</p>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={<Home products={products} searchTerm={searchTerm} />}
            />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="*"
              element={
                <div className="not-found-page">
                  <span className="empty-icon">🧭</span>
                  <h2>Page Not Found</h2>
                  <p>The page you are trying to visit does not exist.</p>
                  <Link to="/" className="btn-hero-primary">
                    Return to Homepage
                  </Link>
                </div>
              }
            />
          </Routes>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="footer-modern">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <span>🛍️</span> Shop<span className="brand-highlight">Sphere</span>
              </div>
              <p className="footer-bio">
                Your premier destination for flagship tech, high-fidelity audio, and premium everyday gear.
              </p>
              <div className="footer-social-pills">
                <span className="social-pill">Twitter</span>
                <span className="social-pill">Instagram</span>
                <span className="social-pill">GitHub</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Catalog</Link></li>
                <li><Link to="/wishlist">Saved Wishlist</Link></li>
                <li><Link to="/cart">Cart</Link></li>
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Create Account</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Customer Care</h4>
              <ul>
                <li><span>Shipping Policy</span></li>
                <li><span>Returns & Refunds</span></li>
                <li><span>Terms of Service</span></li>
                <li><span>Privacy Policy</span></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Secure Shopping</h4>
              <p className="footer-subtext">
                All transactions are encrypted with industry-standard 256-bit SSL protection.
              </p>
              <div className="payment-badges-row">
                <span className="pay-badge">UPI</span>
                <span className="pay-badge">VISA</span>
                <span className="pay-badge">Mastercard</span>
                <span className="pay-badge">RuPay</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>© 2026 ShopSphere Inc. All rights reserved.</p>
            <p className="footer-heart">Crafted for peak performance & speed</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppLayout />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;