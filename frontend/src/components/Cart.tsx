import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orderApi";
import { getActiveCoupons, validateCoupon } from "../services/couponApi";
import type { CouponDto, CouponValidateResult } from "../services/couponApi";

function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [promoCode, setPromoCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<CouponDto[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Live countdown timer for expiring coupons (last 5 hours)
  const [couponSecondsLeft, setCouponSecondsLeft] = useState<number | null>(null);

  // Load available active coupons on mount
  useEffect(() => {
    getActiveCoupons()
      .then(setAvailableCoupons)
      .catch(() => {});
  }, []);

  // Re-validate applied coupon if totalPrice changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.valid) {
      validateCoupon(appliedCoupon.code, totalPrice).then((res) => {
        if (res.valid) {
          setAppliedCoupon(res);
          setPromoError("");
          if (res.valid_until) {
            const diff = Math.max(0, Math.floor((new Date(res.valid_until).getTime() - Date.now()) / 1000));
            setCouponSecondsLeft(diff);
          }
        } else {
          setAppliedCoupon(null);
          setPromoError(res.message);
          setCouponSecondsLeft(null);
        }
      });
    }
  }, [totalPrice]);

  // Live timer tick for coupon urgency
  useEffect(() => {
    if (couponSecondsLeft === null || couponSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setCouponSecondsLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [couponSecondsLeft]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`;
  };

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "success">("form");
  const [shippingName, setShippingName] = useState(user?.name || "");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>("");
  const [orderError, setOrderError] = useState<string | null>(null);

  // Shipping & Discount math (₹80 delivery charge for orders under ₹999, Free for ₹999+)
  const FREE_SHIPPING_THRESHOLD = 999;
  const STANDARD_DELIVERY_FEE = 80;
  const shippingFee = totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const discountAmount = appliedCoupon?.valid ? Number(appliedCoupon.calculated_discount) : 0;
  const grandTotal = Math.max(0, totalPrice - discountAmount + shippingFee);

  const handleApplyPromo = async (e?: React.FormEvent, codeToUse?: string) => {
    if (e) e.preventDefault();
    const code = (codeToUse || promoCode).trim();
    if (!code) return;

    setIsValidatingPromo(true);
    setPromoError("");

    try {
      const res = await validateCoupon(code, totalPrice);
      if (res.valid) {
        setAppliedCoupon(res);
        setPromoCode(res.code);
        setPromoError("");
        if (res.valid_until) {
          const diff = Math.max(0, Math.floor((new Date(res.valid_until).getTime() - Date.now()) / 1000));
          setCouponSecondsLeft(diff);
        }
      } else {
        setAppliedCoupon(null);
        setPromoError(res.message);
        setCouponSecondsLeft(null);
      }
    } catch {
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
    setCouponSecondsLeft(null);
  };

  const handleStartCheckout = () => {
    if (!shippingName && user?.name) {
      setShippingName(user.name);
    }
    setPaymentMethod("cod");
    setIsCheckoutOpen(true);
    setCheckoutStep("form");
    setOrderError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim() || !shippingCity.trim()) {
      alert("Please fill in your complete delivery address.");
      return;
    }

    setIsProcessing(true);
    setOrderError(null);

    try {
      if (isAuthenticated) {
        // Send real order to backend API & save to DB
        const itemsPayload = cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        }));

        const result = await createOrder({
          items: itemsPayload,
          shipping_address: `${shippingAddress}, ${shippingCity}`,
          payment_method: paymentMethod,
        });

        setPlacedOrderId(`#ORD-${result.id}`);
      } else {
        const orderNum = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
        setPlacedOrderId(orderNum);
      }

      setCheckoutStep("success");
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setOrderError(msg);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="cart-page-wrapper">
      <div className="cart-header-block">
        <span className="cart-badge-eyebrow">YOUR SHOPPING BAG</span>
        <h1 className="cart-main-heading">Shopping Cart</h1>
        <p className="cart-subheading">
          {totalItems > 0
            ? `You have ${totalItems} item${totalItems > 1 ? "s" : ""} in your bag`
            : "Your bag is currently empty"}
        </p>
      </div>

      {cart.length === 0 && checkoutStep !== "success" ? (
        <div className="empty-cart-card">
          <span className="empty-cart-emoji">🛒</span>
          <h2>Your bag is empty</h2>
          <p>Explore our wide collection of flagship devices and essentials to get started.</p>
          <Link to="/" className="btn-hero-primary">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="cart-grid-layout">
          {/* Items Column */}
          <div className="cart-items-column">
            {/* Free Shipping Progress */}
            <div className="shipping-progress-card">
              {totalPrice >= FREE_SHIPPING_THRESHOLD ? (
                <p className="free-shipping-achieved">
                  🎉 <strong>Congratulations!</strong> You qualify for <strong>FREE Delivery</strong> (orders ₹999 and above).
                </p>
              ) : (
                <>
                  <p className="shipping-hint-text">
                    Add <strong>₹{(FREE_SHIPPING_THRESHOLD - totalPrice).toLocaleString("en-IN")}</strong> more to get <strong>FREE Delivery</strong>! (Orders under ₹999 incur ₹80 delivery fee)
                  </p>
                  <div className="shipping-bar-track">
                    <div
                      className="shipping-bar-fill"
                      style={{
                        width: `${Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>


            {/* List of Cart Items */}
            <div className="cart-items-list">
              {cart.map((item) => (
                <article className="cart-item-card" key={item.product.id}>
                  <Link to={`/product/${item.product.id}`} className="cart-item-thumb-wrap">
                    <img src={item.product.image} alt={item.product.name} className="cart-item-thumb" />
                  </Link>

                  <div className="cart-item-info">
                    <span className="cart-item-category">{item.product.category}</span>
                    <Link to={`/product/${item.product.id}`} className="cart-item-title-link">
                      <h3 className="cart-item-title">{item.product.name}</h3>
                    </Link>
                    <span className="cart-item-unit-price">
                      ₹{item.product.price.toLocaleString("en-IN")} each
                    </span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="item-qty-stepper">
                      <button
                        onClick={() => decreaseQuantity(item.product.id)}
                        className="qty-btn-minus"
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-count-val">{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.product.id)}
                        className="qty-btn-plus"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-line-total">
                      <strong>
                        ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <button
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.product.id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-bottom-actions">
              <Link to="/" className="btn-continue-shopping">
                ← Continue Shopping
              </Link>
              <button onClick={clearCart} className="btn-clear-all-cart">
                Clear Cart
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <aside className="cart-summary-sidebar">
            <div className="summary-card-inner">
              <h2 className="summary-title">Order Summary</h2>

              {/* Promo Code Input & Available Coupons */}
              <div className="promo-section-container">
                {/* Available Coupons Drawer */}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="available-coupons-box">
                    <span className="available-coupons-title">🏷️ Active Offers & Promo Codes:</span>
                    <div className="coupons-pills-wrap">
                      {availableCoupons.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleApplyPromo(undefined, c.code)}
                          className="coupon-pill-btn"
                          title={`Click to apply ${c.code}`}
                        >
                          <strong>{c.code}</strong>
                          <span>• {c.discount_type === "percentage" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => handleApplyPromo(e)} className="promo-input-form">
                  <label htmlFor="promo-input">Promotional Coupon</label>
                  <div className="promo-input-row">
                    <input
                      id="promo-input"
                      type="text"
                      placeholder="e.g. FLASH30 or MEGA500"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon || isValidatingPromo}
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="btn-remove-promo"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isValidatingPromo || !promoCode.trim()}
                      >
                        {isValidatingPromo ? "Verifying..." : "Apply"}
                      </button>
                    )}
                  </div>
                  {promoError && <p className="promo-error-msg">⚠️ {promoError}</p>}
                  {appliedCoupon && (
                    <p className="promo-success-msg">
                      ✅ {appliedCoupon.message}
                    </p>
                  )}
                </form>

                {/* 5-Hour Countdown Urgency Timer Banner */}
                {appliedCoupon && couponSecondsLeft !== null && couponSecondsLeft <= 18000 && (
                  <div className="coupon-urgency-timer-card">
                    <div className="urgency-timer-top">
                      <span className="urgency-icon">⏳</span>
                      <span className="urgency-heading">LIMITED TIME OFFER!</span>
                    </div>
                    <p className="urgency-sub">
                      Promo code <strong>{appliedCoupon.code}</strong> expires soon:
                    </p>
                    <div className="urgency-countdown-clock">
                      {formatTimer(couponSecondsLeft)}
                    </div>
                    <p className="urgency-foot">Checkout now to lock in your savings!</p>
                  </div>
                )}
              </div>

              <div className="summary-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal ({totalItems} items)</span>
                  <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="breakdown-row discount-row">
                    <span>
                      Coupon Discount (<strong>{appliedCoupon.code}</strong>)
                    </span>
                    <strong style={{ color: "#059669" }}>- ₹{discountAmount.toLocaleString("en-IN")}</strong>
                  </div>
                )}

                <div className="breakdown-row">
                  <span>Delivery Charge</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="free-shipping-tag">FREE</span>
                    ) : (
                      <strong style={{ color: "var(--text-primary)" }}>₹80</strong>
                    )}
                  </span>
                </div>

                <div className="breakdown-row">
                  <span>Taxes (GST included)</span>
                  <span>Included</span>
                </div>

                <hr className="summary-divider" />

                <div className="breakdown-row grand-total-row">
                  <span>Grand Total</span>
                  <strong>₹{grandTotal.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <button className="btn-checkout-proceed" onClick={handleStartCheckout}>
                Proceed to Checkout (COD) →
              </button>

              <div className="security-guarantee-note" style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                <div><span>💵</span> <strong>Cash on Delivery:</strong> Pay safely upon arrival</div>
                <div><span>⚡</span> <strong>24-Hour Cancellation:</strong> You can cancel your order within 24 hours of placement</div>
                <div><span>🔄</span> <strong>10 Days Return/Exchange:</strong> Doorstep pickup & replacements available</div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Interactive Checkout Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsCheckoutOpen(false)}>
              ✕
            </button>

            {checkoutStep === "form" ? (
              <div>
                <div className="modal-header">
                  <span className="modal-badge">CASH ON DELIVERY CHECKOUT</span>
                  <h2>Confirm Delivery Details</h2>
                  <p>Amount to Pay on Arrival: <strong>₹{grandTotal.toLocaleString("en-IN")}</strong></p>
                </div>

                {!isAuthenticated && (
                  <div className="guest-checkout-alert">
                    <span>💡 Tip:</span>{" "}
                    <Link to="/login" state={{ from: "/cart" }}>
                      Sign In
                    </Link>{" "}
                    to automatically save and track this order in your account!
                  </div>
                )}

                <form onSubmit={handlePlaceOrder} className="checkout-form-grid">
                  <div className="checkout-field-full">
                    <label>Recipient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                    />
                  </div>

                  <div className="checkout-field-full">
                    <label>Street Address</label>
                    <input
                      type="text"
                      required
                      placeholder="House/Flat No., Street, Landmark"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                  </div>

                  <div className="checkout-field-half">
                    <label>City / State</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai, MH"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                    />
                  </div>

                  <div className="checkout-field-half">
                    <label>Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cod">💵 Cash on Delivery (Default)</option>
                      <option value="upi">UPI / QR (Pay to Delivery Agent)</option>
                    </select>
                  </div>

                  {/* 24-hr Cancellation Highlight Banner at order placement */}
                  <div
                    className="checkout-field-full"
                    style={{
                      background: "rgba(37, 99, 235, 0.08)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      color: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>⚡</span>
                    <span>
                      <strong>Cancellation Policy:</strong> You can cancel this order anytime within <strong>24 hours</strong> of placement directly from your account. 10-day replacement & returns available after delivery.
                    </span>
                  </div>

                  {orderError && (
                    <div style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      {orderError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-place-order-submit"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Placing Order..." : `Confirm Order • Pay ₹${grandTotal.toLocaleString("en-IN")} on Delivery`}
                  </button>
                </form>
              </div>
            ) : (
              <div className="order-success-stage">
                <span className="success-icon-big">🎉</span>
                <h2>Order Confirmed!</h2>
                <p className="order-number-tag">Reference ID: <strong>{placedOrderId}</strong></p>
                <div className="guest-checkout-alert" style={{ textAlign: "left", margin: "16px 0" }}>
                  <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
                  <p><strong>Total Due at Doorstep:</strong> ₹{grandTotal.toLocaleString("en-IN")}</p>
                  <p><strong>Estimated Delivery:</strong> 2-3 Business Days</p>
                  <p style={{ color: "#065f46", fontWeight: 700, marginTop: "6px" }}>
                    ⚡ You can cancel this order within 24 hours from your My Orders dashboard.
                  </p>
                </div>
                <p className="order-success-detail">
                  Your order has been booked and queued for express packing. You can track this live in your account.
                </p>
                <div className="success-actions-row" style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                  {isAuthenticated ? (
                    <Link to="/orders" className="btn-hero-primary" onClick={() => setIsCheckoutOpen(false)}>
                      📦 Track in My Orders →
                    </Link>
                  ) : (
                    <Link to="/login" className="btn-hero-primary" onClick={() => setIsCheckoutOpen(false)}>
                      Sign In to Track
                    </Link>
                  )}
                  <Link to="/" className="btn-outline-clear" style={{ padding: "12px 20px" }} onClick={() => setIsCheckoutOpen(false)}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;