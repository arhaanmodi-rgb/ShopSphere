import React from "react";
import type { OrderDto } from "../services/orderApi";
import { products } from "../data/products";

interface InvoiceModalProps {
  order: OrderDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const total = Number(order.total_amount);
  // Estimate GST (18% inclusive)
  const taxableSubtotal = Math.round((total / 1.18) * 100) / 100;
  const totalGst = Math.round((total - taxableSubtotal) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst / 2) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar (Hidden during print) */}
        <div className="invoice-top-actions no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="invoice-preview-tag">Official GST Tax Invoice Preview</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>#ORD-{order.id}</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handlePrint} className="btn-hero-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
              <span>🖨️ Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="btn-admin-del" style={{ padding: "8px 14px", fontSize: "14px" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="invoice-printable-sheet" id="invoice-sheet">
          {/* Header Row */}
          <div className="invoice-sheet-header">
            <div className="invoice-company-left">
              <div className="invoice-brand-logo">
                <span className="brand-emoji">🛍️</span> Shop<span className="brand-accent">Sphere</span>
              </div>
              <p className="invoice-company-name">ShopSphere Retail & Logistics Private Limited</p>
              <p className="invoice-company-address">
                Tower B, Sector 62, Cyber City, Gurugram, Haryana - 122002<br />
                <strong>GSTIN:</strong> 06AAACS8214M1Z5 &nbsp;|&nbsp; <strong>CIN:</strong> U72900HR2026PTC089123
              </p>
            </div>

            <div className="invoice-meta-right">
              <div className="invoice-title-badge">TAX INVOICE</div>
              <div className="invoice-meta-grid">
                <div className="invoice-meta-row">
                  <span className="meta-label">Invoice No:</span>
                  <span className="meta-val">INV-2026-{String(order.id).padStart(5, "0")}</span>
                </div>
                <div className="invoice-meta-row">
                  <span className="meta-label">Order ID:</span>
                  <span className="meta-val">#ORD-{order.id}</span>
                </div>
                <div className="invoice-meta-row">
                  <span className="meta-label">Invoice Date:</span>
                  <span className="meta-val">{invoiceDate}</span>
                </div>
                <div className="invoice-meta-row">
                  <span className="meta-label">Payment Mode:</span>
                  <span className="meta-val" style={{ color: "#059669", fontWeight: 700 }}>
                    💵 Cash on Delivery (COD)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-horizontal-line" />

          {/* Customer & Delivery Logistics Grid */}
          <div className="invoice-addresses-grid">
            <div className="invoice-address-box">
              <div className="invoice-box-label">BILLED TO & DELIVER TO:</div>
              <h4 className="invoice-customer-name">{order.user_name || "Valued Customer"}</h4>
              <div className="invoice-address-text">
                <p><strong>Email:</strong> {order.user_email || "Customer"}</p>
                <p><strong>Delivery Address:</strong> {order.shipping_address || "Standard Ground Delivery Address"}</p>
                <p><strong>Country:</strong> India</p>
              </div>
            </div>

            <div className="invoice-address-box">
              <div className="invoice-box-label">FULFILLMENT HUB & DISPATCH:</div>
              <h4 className="invoice-customer-name">ShopSphere Express Hub #402</h4>
              <div className="invoice-address-text">
                <p><strong>Logistics Partner:</strong> ShopSphere HyperLocal Logistics</p>
                <p><strong>Order Status:</strong> <span className="status-highlight">{order.status.toUpperCase().replace("_", " ")}</span></p>
                <p><strong>Declaration:</strong> Goods sold for retail domestic consumption.</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="invoice-table-wrapper">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ textAlign: "left" }}>Item Description</th>
                  <th style={{ width: "90px", textAlign: "center" }}>HSN/SAC</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "110px", textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: "120px", textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const match = products.find((p) => p.id === item.product_id);
                  const name = match?.name || item.product_name || `Product #${item.product_id}`;
                  const itemTotal = Number(item.price_at_purchase) * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>
                        <div className="item-name-bold">{name}</div>
                        <div className="item-category-sub">Category: {match?.category || "General Merchandise"}</div>
                      </td>
                      <td style={{ textAlign: "center", color: "#64748b" }}>84713010</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>₹{Number(item.price_at_purchase).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation Section */}
          <div className="invoice-summary-layout">
            <div className="invoice-barcode-col">
              <div className="invoice-barcode-strip">
                <span className="barcode-bars">||| | |||| || ||| |||| | ||| |||||| || | || |||||</span>
                <span className="barcode-text">*ORD-{order.id}-SHOPSPHERE-COD*</span>
              </div>
              <div className="invoice-terms-block">
                <p><strong>Terms & Conditions:</strong></p>
                <ul>
                  <li>This is a computer-generated tax invoice and requires no physical signature.</li>
                  <li>Eligible for <strong>10-Day Return & Exchange</strong> from delivery date.</li>
                  <li>Goods once sold can be replaced through our automated online return portal.</li>
                </ul>
              </div>
            </div>

            <div className="invoice-totals-col">
              <table className="invoice-calc-table">
                <tbody>
                  <tr>
                    <td className="calc-label">Taxable Subtotal:</td>
                    <td className="calc-val">₹{taxableSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">CGST (9.0%):</td>
                    <td className="calc-val">₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">SGST (9.0%):</td>
                    <td className="calc-val">₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">Delivery & Handling:</td>
                    <td className="calc-val" style={{ color: total >= 999 ? "#059669" : "inherit" }}>
                      {total >= 999 ? "FREE (Orders ₹999+)" : "₹80.00"}
                    </td>
                  </tr>
                  <tr className="invoice-grand-total-row">
                    <td className="calc-label grand">Grand Total (COD):</td>
                    <td className="calc-val grand">
                      ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-stamp-container">
                <div className="invoice-paid-stamp">
                  <span>💵 CASH ON DELIVERY</span>
                  <small>OFFICIALLY RECORDED</small>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-footer-sign">
            <span>Authorised Signatory for ShopSphere Retail & Logistics Pvt Ltd</span>
          </div>
        </div>
      </div>
    </div>
  );
};
