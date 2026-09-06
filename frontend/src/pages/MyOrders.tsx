import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, cancelOrder } from "../services/orderApi";
import type { OrderDto } from "../services/orderApi";
import { products } from "../data/products";
import { InvoiceModal } from "../components/InvoiceModal";
import { ReturnExchangeModal } from "../components/ReturnExchangeModal";

interface StepConfig {
  label: string;
  description: string;
  icon: string;
}

const ORDER_STEPS: StepConfig[] = [
  {
    label: "Order Received",
    description: "Received & queued for packing",
    icon: "⏱️",
  },
  {
    label: "Order Confirmed",
    description: "Verified & ready to dispatch",
    icon: "✅",
  },
  {
    label: "Shipped",
    description: "Handed over to courier",
    icon: "🚚",
  },
  {
    label: "Out for Delivery",
    description: "Arriving at your doorstep",
    icon: "📍",
  },
  {
    label: "Delivered",
    description: "Delivered successfully",
    icon: "✨",
  },
];

function getStepIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "pending":
    case "order_received":
      return 0;
    case "confirmed":
      return 1;
    case "shipped":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "delivered":
      return "Delivered";
    case "out_for_delivery":
      return "Out for Delivery";
    case "shipped":
      return "Shipped";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    case "return_requested":
      return "Return Requested";
    case "exchange_requested":
      return "Exchange Requested";
    case "returned":
      return "Returned";
    case "exchanged":
      return "Exchanged";
    default:
      return "Order Received";
  }
}

export const MyOrders: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderDto | null>(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<OrderDto | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchOrders = async (showLoadingSpinner = true) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (showLoadingSpinner) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load orders";
      setError(message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm(`Are you sure you want to cancel Order #ORD-${orderId}? This action cannot be undone.`)) {
      return;
    }

    setCancellingId(orderId);
    try {
      const updated = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      showToast(`Order #ORD-${orderId} has been cancelled successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order.";
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const handleReturnSuccess = (updatedOrder: OrderDto) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    showToast(`Return / Exchange request submitted for Order #ORD-${updatedOrder.id}!`);
  };

  if (!isAuthenticated) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view">
          <span className="empty-orders-icon">📦</span>
          <h2 className="empty-orders-heading">Track Your Orders</h2>
          <p className="empty-orders-text">
            Please log in to your account to view your purchase history, shipment status, and real-time live tracking.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-hero-primary"
          >
            Sign In to View Orders →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      {/* Toast */}
      {toastMsg && (
        <div className="global-toast-banner" onClick={() => setToastMsg(null)}>
          <span className="toast-icon">✅</span>
          <span className="toast-text">{toastMsg}</span>
          <button className="toast-close-btn" onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* Return / Exchange Modal */}
      <ReturnExchangeModal
        order={selectedReturnOrder}
        isOpen={!!selectedReturnOrder}
        onClose={() => setSelectedReturnOrder(null)}
        onSuccess={handleReturnSuccess}
      />

      {/* Header Bar */}
      <div className="orders-header-row">
        <div className="orders-header-left">
          <div className="orders-title-group">
            <h1 className="orders-main-title">My Orders</h1>
            <span className="orders-count-badge">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>
          <p className="orders-subtitle">
            Live shipment tracking, 24-hr cancellations & 10-day replacements for <strong style={{ color: "var(--text-primary)" }}>{user?.email}</strong>
          </p>
        </div>

        <div className="orders-header-actions">
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="btn-refresh-orders"
            title="Refresh latest status from server"
          >
            <span>🔄</span>
            <span>{isRefreshing ? "Refreshing..." : "Refresh Status"}</span>
          </button>
          <Link to="/" className="btn-hero-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
            Shop More →
          </Link>
        </div>
      </div>

      {/* Policy highlights bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          background: "#ffffff",
          padding: "12px 18px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          marginBottom: "20px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>⚡</span>
          <span><strong>24-Hour Easy Cancellation:</strong> Cancel any unprocessed shipment within 24 hours of placement.</span>
        </div>
        <span style={{ color: "var(--border-subtle)" }}>|</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🔄</span>
          <span><strong>10 Days Return & Exchange:</strong> Doorstep pickup and replacements available for 10 days post delivery.</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="global-page-loader" style={{ minHeight: "300px" }}>
          <div className="loading-spinner-ring"></div>
          <p>Loading your orders & shipments...</p>
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="order-cancelled-box" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="empty-orders-view">
          <span className="empty-orders-icon">🛍️</span>
          <h3 className="empty-orders-heading">No Orders Placed Yet</h3>
          <p className="empty-orders-text">
            You haven't placed any orders yet. Discover over 220+ top electronics, fashion apparel, footwear, and accessories with Cash on Delivery!
          </p>
          <Link to="/" className="btn-hero-primary">
            Explore 220+ Products →
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="orders-list-stack">
          {orders.map((order) => {
            const currentStep = getStepIndex(order.status);
            const statusClass = order.status.toLowerCase();
            const isCancelled = statusClass === "cancelled";
            const isReturnOrExchange = statusClass.includes("return") || statusClass.includes("exchange");
            const isDelivered = statusClass === "delivered";
            const statusLabel = getStatusLabel(order.status);

            // Time calculation
            const createdAtDate = order.created_at ? new Date(order.created_at) : new Date();
            const hoursSince = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60);
            const canCancelOrder = !isCancelled && !isDelivered && !isReturnOrExchange && hoursSince <= 24;
            const hoursLeftCancel = Math.max(0, 24 - hoursSince);

            return (
              <div key={order.id} className="order-receipt-card">
                {/* Order Top Bar */}
                <div className="order-card-top-bar">
                  <div>
                    <div className="order-id-headline">
                      <span className="order-id-label">ORDER ID</span>
                      <span className="order-id-number">#ORD-{order.id}</span>
                      <span className={`status-pill ${statusClass}`}>
                        <span className="status-dot"></span>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="order-metadata-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                      <span>Date: <strong style={{ color: "var(--text-primary)" }}>{createdAtDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
                      <span>•</span>
                      <span>Payment: <strong style={{ color: "var(--text-primary)" }}>💵 Cash on Delivery (COD)</strong></span>
                      <span>•</span>
                      <span>Total Items: <strong style={{ color: "var(--text-primary)" }}>{order.items?.length || 0}</strong></span>
                      <span>•</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span>📍</span>
                        <span>Delivering to: <strong style={{ color: "var(--text-primary)" }}>{order.shipping_address || "Standard Delivery Address"}</strong></span>
                      </span>
                    </div>
                  </div>

                  <div className="order-amount-block" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <div>
                      <span className="amount-due-label">Total Amount Due</span>
                      <span className="amount-due-value">
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {/* Customer Cancel Button (within 24 hours) */}
                      {canCancelOrder && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="btn-delete-product-trash"
                          style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          title="Cancel this order (Available within 24 hours of placement)"
                        >
                          <span>✕</span>
                          <span>{cancellingId === order.id ? "Cancelling..." : "Cancel Order"}</span>
                        </button>
                      )}

                      {/* Customer Return / Exchange Button (within 10 days of delivery) */}
                      {isDelivered && (order.can_return_exchange !== false) && (
                        <button
                          onClick={() => setSelectedReturnOrder(order)}
                          className="btn-hero-primary"
                          style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          title="Request 10-Day Doorstep Return or Exchange"
                        >
                          <span>🔄</span>
                          <span>Return / Exchange</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="btn-print-tax-invoice"
                        title="View & Print Official GST Tax Invoice"
                      >
                        <span>🖨️</span>
                        <span>Tax Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 24-hr cancel notice banner if active */}
                {canCancelOrder && (
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "12px",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>⏳</span>
                      <span><strong>24-Hour Free Cancellation Active:</strong> You can cancel this order within the next <strong>{Math.floor(hoursLeftCancel)}h {Math.floor((hoursLeftCancel % 1) * 60)}m</strong>.</span>
                    </span>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "12px",
                      }}
                    >
                      Cancel Now
                    </button>
                  </div>
                )}

                {/* 10-day return notice banner if delivered */}
                {isDelivered && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      color: "#065f46",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "12px",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🔄</span>
                      <span><strong>10-Day Assurance Policy:</strong> Delivered successfully! You can request a replacement or return within 10 days of delivery.</span>
                    </span>
                    <button
                      onClick={() => setSelectedReturnOrder(order)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-primary)",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "12px",
                      }}
                    >
                      Start Return / Exchange
                    </button>
                  </div>
                )}

                {/* Return/Exchange Requested banner */}
                {isReturnOrExchange && (
                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12px",
                      color: "#1e40af",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>🔄</span>
                    <div>
                      <strong>{statusLabel} Registered</strong>
                      <p style={{ margin: "2px 0 0 0", color: "#3b82f6" }}>
                        Reason: {order.return_exchange_reason || "Customer requested resolution"} • Our pickup executive will visit within 24-48 hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tracking Stepper */}
                {!isCancelled && !isReturnOrExchange ? (
                  <div className="stepper-section">
                    <h4 className="stepper-title">Live Shipment Progress</h4>

                    <div className="stepper-timeline-wrap">
                      {/* Progress Line */}
                      <div className="stepper-progress-bar-bg">
                        <div
                          className="stepper-progress-bar-fill"
                          style={{
                            width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Step items */}
                      <div className="stepper-steps-grid">
                        {ORDER_STEPS.map((step, idx) => {
                          const isDone = idx < currentStep;
                          const isCurrent = idx === currentStep;
                          const isUpcoming = idx > currentStep;

                          return (
                            <div
                              key={step.label}
                              className={`stepper-step-col ${isUpcoming ? "is-pending" : ""}`}
                            >
                              <div
                                className={`step-circle-icon ${
                                  isDone ? "is-done" : isCurrent ? "is-current" : "is-upcoming"
                                }`}
                              >
                                {isDone ? "✓" : step.icon}
                              </div>

                              <div>
                                <p
                                  className={`step-text-title ${
                                    isCurrent ? "current" : isDone ? "done" : ""
                                  }`}
                                >
                                  {step.label}
                                </p>
                                <p className="step-text-desc">{step.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : isCancelled ? (
                  <div className="order-cancelled-box">
                    <span style={{ fontSize: "20px" }}>❌</span>
                    <div>
                      <strong style={{ display: "block" }}>Order Cancelled</strong>
                      <span style={{ fontSize: "12px", opacity: 0.9 }}>
                        This shipment has been cancelled. Inventory has been restored and no payment is required.
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Ordered Items List */}
                <div className="order-items-container">
                  <h4 className="order-items-heading">Items in this shipment</h4>
                  <div className="order-items-grid">
                    {order.items.map((item) => {
                      const productMatch = products.find((p) => p.id === item.product_id);
                      const img =
                        productMatch?.image ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80";

                      return (
                        <div key={item.id} className="order-item-card">
                          <img
                            src={img}
                            alt={item.product_name || "Product"}
                            className="order-item-img"
                          />
                          <div className="order-item-details">
                            <div className="order-item-name">
                              {item.product_name || productMatch?.name || `Product #${item.product_id}`}
                            </div>
                            <div className="order-item-calc">
                              Qty: <strong>{item.quantity}</strong> × ₹{Number(item.price_at_purchase).toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div className="order-item-subtotal">
                            ₹{(Number(item.price_at_purchase) * item.quantity).toLocaleString("en-IN")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
