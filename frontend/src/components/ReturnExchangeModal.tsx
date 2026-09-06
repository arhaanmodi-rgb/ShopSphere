import React, { useState } from "react";
import type { OrderDto } from "../services/orderApi";
import { requestReturnExchange } from "../services/orderApi";

interface ReturnExchangeModalProps {
  order: OrderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: OrderDto) => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [requestType, setRequestType] = useState<"return" | "exchange">("exchange");
  const [reason, setReason] = useState("Defective or damaged product");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await requestReturnExchange(order.id, {
        type: requestType,
        reason,
        comments: comments.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
        <div className="modal-header-row">
          <div>
            <span className="cart-badge-eyebrow">10-DAY POST-DELIVERY ASSURANCE</span>
            <h3 className="modal-title">Return or Exchange #ORD-{order.id}</h3>
          </div>
          <button onClick={onClose} className="btn-admin-del" style={{ padding: "6px 12px" }}>
            ✕
          </button>
        </div>

        {error && (
          <div className="order-cancelled-box" style={{ padding: "10px 14px", marginTop: "12px", background: "#fef2f2", borderColor: "#fecaca" }}>
            <span>⚠️</span>
            <span style={{ fontSize: "12px" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form" style={{ marginTop: "16px" }}>
          {/* Request Type Selector */}
          <div className="form-group-block">
            <label className="input-label-stylish">Select Resolution Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setRequestType("exchange")}
                className={`return-type-pill ${requestType === "exchange" ? "active" : ""}`}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: requestType === "exchange" ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  background: requestType === "exchange" ? "var(--accent-light)" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>🔄</div>
                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "13px" }}>
                  Product Exchange
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Doorstep replacement
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestType("return")}
                className={`return-type-pill ${requestType === "return" ? "active" : ""}`}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: requestType === "return" ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  background: requestType === "return" ? "var(--accent-light)" : "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>💰</div>
                <strong style={{ display: "block", color: "var(--text-primary)", fontSize: "13px" }}>
                  Return & Refund
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Pickup & full refund
                </span>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="form-group-block" style={{ marginTop: "14px" }}>
            <label className="input-label-stylish">Reason for {requestType === "exchange" ? "Exchange" : "Return"}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="styled-input-field"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginTop: "4px" }}
            >
              <option value="Defective or damaged product">Defective or damaged product upon arrival</option>
              <option value="Wrong item or color delivered">Wrong item or color delivered</option>
              <option value="Size or fitting issue">Size or fitting issue (Need size change)</option>
              <option value="Product quality not satisfactory">Product quality not as expected</option>
              <option value="Product differs from description">Item looks different from images</option>
              <option value="Performance or hardware issue">Technical / performance issue</option>
              <option value="Other reason">Other reason</option>
            </select>
          </div>

          {/* Additional details */}
          <div className="form-group-block" style={{ marginTop: "14px" }}>
            <label className="input-label-stylish">Additional Details / Remarks (Optional)</label>
            <textarea
              rows={3}
              placeholder="Tell us more about the issue to help our fulfillment team expedite pickup..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="styled-input-field"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginTop: "4px", resize: "vertical" }}
            />
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginTop: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📦</span>
            <span>
              Doorstep courier pickup will be scheduled within <strong>24-48 hours</strong>. Please keep item packaging and accessories intact.
            </span>
          </div>

          <div className="modal-actions-row" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} className="btn-refresh-orders" style={{ padding: "10px 18px" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-hero-primary"
              style={{ padding: "10px 22px" }}
            >
              {isSubmitting ? "Submitting..." : `Submit ${requestType === "exchange" ? "Exchange" : "Return"} Request ✓`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
