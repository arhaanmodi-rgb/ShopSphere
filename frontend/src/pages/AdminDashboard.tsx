import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAdminOrders,
  updateOrderStatus,
  getAdminStats,
  getAdminProducts,
  createAdminProduct,
  updateAdminProductStock,
  updateAdminProductPrice,
  updateAdminProduct,
  deleteAdminProduct,
} from "../services/orderApi";
import type { OrderDto, AdminStats, AdminProductDto } from "../services/orderApi";
import {
  getAdminCoupons,
  createAdminCoupon,
  toggleAdminCoupon,
  deleteAdminCoupon,
} from "../services/couponApi";
import type { CouponDto } from "../services/couponApi";
import {
  getAdminFlashDeals,
  createAdminFlashDeal,
  toggleAdminFlashDeal,
  deleteAdminFlashDeal,
} from "../services/flashDealApi";
import type { FlashDealDto } from "../services/flashDealApi";
import { products as initialProducts } from "../data/products";
import { InvoiceModal } from "../components/InvoiceModal";

export const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<"orders" | "catalog" | "coupons" | "deals" | "analytics">("orders");

  // Orders State
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderDto | null>(null);

  // Catalog State
  const [catalog, setCatalog] = useState<AdminProductDto[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogStockFilter, setCatalogStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Coupons State
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [couponSearch, setCouponSearch] = useState("");
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "flat">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMinOrderAmount, setNewMinOrderAmount] = useState("0");
  const [newValidUntil, setNewValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  // Flash Deals State
  const [flashDeals, setFlashDeals] = useState<FlashDealDto[]>([]);
  const [dealSearch, setDealSearch] = useState("");
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [selectedDealProductId, setSelectedDealProductId] = useState<number>(0);
  const [dealDiscountPercent, setDealDiscountPercent] = useState("30");
  const [dealEndsAt, setDealEndsAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 12);
    return d.toISOString().slice(0, 16);
  });
  const [isSavingDeal, setIsSavingDeal] = useState(false);
  
  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Electronics");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("25");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<AdminProductDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Electronics");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isAdmin = isAuthenticated && user?.role === "admin";

  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [ordersData, statsData, productsData, couponsData, flashDealsData] = await Promise.all([
        getAdminOrders(),
        getAdminStats().catch(() => null),
        getAdminProducts().catch(() => []),
        getAdminCoupons().catch(() => []),
        getAdminFlashDeals().catch(() => []),
      ]);
      setOrders(ordersData);
      setStats(statsData);
      setCoupons(couponsData);
      setFlashDeals(flashDealsData);
      setCatalog(
        productsData.length > 0
          ? productsData
          : initialProducts.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              stock_quantity: p.stock ?? 25,
            }))
      );
      if (productsData.length > 0 && selectedDealProductId === 0) {
        setSelectedDealProductId(productsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // CSV Orders Export
  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert("No orders available to export.");
      return;
    }
    const headers = [
      "Order_ID",
      "Date",
      "Customer_Name",
      "Customer_Email",
      "Shipping_Address",
      "Items_Count",
      "Total_Amount_INR",
      "Payment_Method",
      "Status",
    ];
    const rows = orders.map((o) => [
      `ORD-${o.id}`,
      o.created_at ? new Date(o.created_at).toLocaleString() : "N/A",
      `"${(o.user_name || "").replace(/"/g, '""')}"`,
      `"${(o.user_email || "").replace(/"/g, '""')}"`,
      `"${(o.shipping_address || "").replace(/"/g, '""')}"`,
      o.items.reduce((sum, item) => sum + item.quantity, 0),
      o.total_amount,
      "Cash on Delivery",
      o.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ShopSphere_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Orders ledger CSV downloaded successfully!");
  };

  // Update Order Status
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
      showToast(`Order #ORD-${orderId} set to ${newStatus.replace("_", " ").toUpperCase()}`);
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status";
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Out of Stock / In Stock
  const handleToggleStock = async (product: AdminProductDto) => {
    const newStock = product.stock_quantity > 0 ? 0 : 25;
    try {
      await updateAdminProductStock(product.id, newStock);
      setCatalog((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: newStock } : p))
      );
      showToast(
        newStock === 0
          ? `"${product.name}" marked as OUT OF STOCK`
          : `"${product.name}" RESTOCKED (${newStock} units)`
      );
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock";
      alert(msg);
    }
  };

  // Direct Stock change
  const handleStockInputChange = async (productId: number, qty: number) => {
    if (isNaN(qty) || qty < 0) return;
    try {
      await updateAdminProductStock(productId, qty);
      setCatalog((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock_quantity: qty } : p))
      );
      showToast(`Stock updated to ${qty}`);
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock";
      alert(msg);
    }
  };

  // Direct Inline Price change
  const handlePriceInputChange = async (productId: number, newPrice: number) => {
    if (isNaN(newPrice) || newPrice <= 0) return;
    try {
      await updateAdminProductPrice(productId, newPrice);
      setCatalog((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
      );
      showToast(`Price updated to ₹${newPrice.toLocaleString("en-IN")}`);
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update price";
      alert(msg);
    }
  };

  // Open Edit Modal
  const openEditModal = (product: AdminProductDto) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditPrice(product.price.toString());
    setEditStock(product.stock_quantity.toString());
  };

  // Save Edit Product Modal
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSavingEdit(true);
    try {
      const updated = await updateAdminProduct(editingProduct.id, {
        name: editName.trim(),
        category: editCategory,
        price: parseFloat(editPrice),
        stock_quantity: parseInt(editStock) || 0,
      });

      setCatalog((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
      );
      showToast(`Updated "${updated.name}" successfully!`);
      setEditingProduct(null);
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product changes";
      alert(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete product from catalog
  const handleDeleteProduct = async (product: AdminProductDto) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${product.name}" from the catalog?`)) {
      return;
    }
    try {
      await deleteAdminProduct(product.id);
      setCatalog((prev) => prev.filter((p) => p.id !== product.id));
      showToast(`Removed "${product.name}" from catalog`);
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete product";
      alert(msg);
    }
  };

  // Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      alert("Please fill in the product name and price.");
      return;
    }

    setIsAddingProduct(true);
    try {
      const created = await createAdminProduct({
        name: newProductName.trim(),
        category: newProductCategory,
        price: parseFloat(newProductPrice),
        stock_quantity: parseInt(newProductStock) || 0,
      });

      setCatalog((prev) => [created, ...prev]);
      showToast(`Product "${created.name}" added to catalog!`);
      setIsAddModalOpen(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductStock("25");
      getAdminStats().then(setStats).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add product";
      alert(msg);
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Coupon Handlers
  const handleToggleCoupon = async (couponId: number) => {
    try {
      const updated = await toggleAdminCoupon(couponId);
      setCoupons((prev) => prev.map((c) => (c.id === couponId ? updated : c)));
      showToast(`Coupon ${updated.code} is now ${updated.is_active ? "ACTIVE" : "INACTIVE"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle coupon";
      alert(msg);
    }
  };

  const handleDeleteCoupon = async (couponId: number, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon code "${code}"?`)) {
      return;
    }
    try {
      await deleteAdminCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      showToast(`Coupon "${code}" deleted successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete coupon";
      alert(msg);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newDiscountValue) {
      alert("Please enter a coupon code and discount value.");
      return;
    }

    setIsSavingCoupon(true);
    try {
      const validUntilIso = new Date(newValidUntil).toISOString();
      const created = await createAdminCoupon({
        code: newCouponCode.trim().toUpperCase(),
        discount_type: newDiscountType,
        discount_value: parseFloat(newDiscountValue),
        min_order_amount: parseFloat(newMinOrderAmount) || 0,
        valid_until: validUntilIso,
        is_active: true,
      });

      setCoupons((prev) => [created, ...prev]);
      showToast(`Coupon "${created.code}" created successfully!`);
      setIsAddCouponModalOpen(false);
      setNewCouponCode("");
      setNewDiscountValue("");
      setNewMinOrderAmount("0");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      alert(msg);
    } finally {
      setIsSavingCoupon(false);
    }
  };

  // Flash Deals Handlers
  const handleToggleDeal = async (dealId: number) => {
    try {
      const updated = await toggleAdminFlashDeal(dealId);
      setFlashDeals((prev) => prev.map((d) => (d.id === dealId ? updated : d)));
      showToast(`Deal #${dealId} is now ${updated.is_active ? "LIVE on Storefront" : "PAUSED"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle deal status";
      alert(msg);
    }
  };

  const handleDeleteDeal = async (dealId: number, productName?: string) => {
    if (!window.confirm(`Are you sure you want to remove ${productName || "this deal"} from Flash Deals?`)) {
      return;
    }
    try {
      await deleteAdminFlashDeal(dealId);
      setFlashDeals((prev) => prev.filter((d) => d.id !== dealId));
      showToast(`Deal removed successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete deal";
      alert(msg);
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealProductId || !dealDiscountPercent) {
      alert("Please select a product and enter a discount percentage.");
      return;
    }

    setIsSavingDeal(true);
    try {
      const endsAtIso = new Date(dealEndsAt).toISOString();
      const created = await createAdminFlashDeal({
        product_id: selectedDealProductId,
        discount_percentage: parseFloat(dealDiscountPercent),
        ends_at: endsAtIso,
        is_active: true,
      });

      setFlashDeals((prev) => {
        const existingIdx = prev.findIndex((d) => d.product_id === created.product_id);
        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = created;
          return clone;
        }
        return [created, ...prev];
      });
      showToast(`Product added to Deal of the Day with ${created.discount_percentage}% OFF!`);
      setIsAddDealModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save flash deal";
      alert(msg);
    } finally {
      setIsSavingDeal(false);
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view">
          <span className="empty-orders-icon">🛡️</span>
          <h2 className="empty-orders-heading">Admin Access Required</h2>
          <p className="empty-orders-text">
            You must be signed in with an administrator account to view and manage platform orders and catalog.
          </p>
          <button onClick={() => navigate("/")} className="btn-hero-primary">
            Back to Storefront →
          </button>
        </div>
      </div>
    );
  }

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toString().includes(searchQuery) ||
      (order.user_email && order.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.user_name && order.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.shipping_address && order.shipping_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.return_exchange_reason && order.return_exchange_reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (order.status === "pending" || order.status === "order_received")) ||
      (statusFilter === "returns_exchanges" &&
        ["return_requested", "exchange_requested", "returned", "exchanged"].includes(order.status)) ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Filtered Catalog
  const filteredCatalog = catalog.filter((product) => {
    const matchesSearch =
      catalogSearch === "" ||
      product.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      product.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      product.id.toString() === catalogSearch;

    const matchesCat = catalogCategory === "all" || product.category.toLowerCase() === catalogCategory.toLowerCase();

    const matchesStock =
      catalogStockFilter === "all" ||
      (catalogStockFilter === "in_stock" && product.stock_quantity > 0) ||
      (catalogStockFilter === "out_of_stock" && product.stock_quantity <= 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  // Filtered Coupons
  const filteredCoupons = coupons.filter((c) =>
    couponSearch === "" || c.code.toLowerCase().includes(couponSearch.toLowerCase())
  );

  // Filtered Flash Deals
  const filteredDeals = flashDeals.filter((d) => {
    const prod = catalog.find((p) => p.id === d.product_id) || initialProducts.find((p) => p.id === d.product_id);
    const pName = d.product_name || prod?.name || "";
    const pCat = d.product_category || prod?.category || "";
    return (
      dealSearch === "" ||
      pName.toLowerCase().includes(dealSearch.toLowerCase()) ||
      pCat.toLowerCase().includes(dealSearch.toLowerCase()) ||
      d.product_id.toString() === dealSearch
    );
  });

  // Analytics Calculations
  const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const avgOrderValue = nonCancelledOrders.length > 0 ? Math.round(totalRevenue / nonCancelledOrders.length) : 0;
  const totalItemsSold = nonCancelledOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  // Category breakdown
  const categoryStats: Record<string, { revenue: number; itemsCount: number }> = {};
  nonCancelledOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.product_id ?? 0;
      const prod = catalog.find((p) => p.id === pid) || initialProducts.find((p) => p.id === pid);
      const cat = prod?.category || "General";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { revenue: 0, itemsCount: 0 };
      }
      const itemPrice = prod?.price || 499;
      categoryStats[cat].revenue += itemPrice * item.quantity;
      categoryStats[cat].itemsCount += item.quantity;
    });
  });

  const maxCatRev = Math.max(...Object.values(categoryStats).map((c) => c.revenue), 1);

  // Top selling products leaderboard
  const productStats: Record<number, { id: number; name: string; category: string; units: number; revenue: number }> = {};
  nonCancelledOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.product_id ?? 0;
      const prod = catalog.find((p) => p.id === pid) || initialProducts.find((p) => p.id === pid);
      if (!productStats[pid]) {
        productStats[pid] = {
          id: pid,
          name: prod?.name || item.product_name || `Product #${pid}`,
          category: prod?.category || "General",
          units: 0,
          revenue: 0,
        };
      }
      const itemPrice = prod?.price || 499;
      productStats[pid].units += item.quantity;
      productStats[pid].revenue += itemPrice * item.quantity;
    });
  });

  const topProductsLeaderboard = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="admin-panel-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="global-toast-banner" onClick={() => setToastMessage(null)}>
          <span className="toast-icon">✅</span>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-close-btn" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="admin-header-row">
        <div className="admin-header-left">
          <div className="admin-shield-icon-box">🛡️</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 className="admin-main-title">Admin Operations Control</h1>
              <span className="admin-db-badge">PostgreSQL Live</span>
            </div>
            <p className="admin-user-tag">
              Logged in as <strong>{user?.email}</strong> (Administrator)
            </p>
          </div>
        </div>

        <div className="orders-header-actions">
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="btn-refresh-orders"
          >
            <span>🔄</span>
            <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
          </button>
          <Link to="/" className="btn-hero-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
            Storefront →
          </Link>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="admin-main-nav-tabs">
        <button
          onClick={() => setActiveTab("orders")}
          className={`admin-nav-tab-btn ${activeTab === "orders" ? "is-active" : ""}`}
        >
          <span>📦</span>
          <span>Order Management ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`admin-nav-tab-btn ${activeTab === "catalog" ? "is-active" : ""}`}
        >
          <span>🏷️</span>
          <span>Catalog & Prices ({catalog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("coupons")}
          className={`admin-nav-tab-btn ${activeTab === "coupons" ? "is-active" : ""}`}
        >
          <span>🎟️</span>
          <span>Coupons & Promos ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("deals")}
          className={`admin-nav-tab-btn ${activeTab === "deals" ? "is-active" : ""}`}
        >
          <span>⚡</span>
          <span>Flash Deals / Deal of Day ({flashDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`admin-nav-tab-btn ${activeTab === "analytics" ? "is-active" : ""}`}
        >
          <span>📊</span>
          <span>Sales Analytics & Export</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: ORDER MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "orders" && (
        <>
          {/* KPI Cards Grid */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Revenue</span>
                <span className="kpi-icon-emoji">💰</span>
              </div>
              <div className="kpi-number-val">
                ₹{Number(stats?.total_revenue || totalRevenue).toLocaleString("en-IN")}
              </div>
              <span className="kpi-sub-text">Excluding cancelled</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Orders</span>
                <span className="kpi-icon-emoji">📦</span>
              </div>
              <div className="kpi-number-val">{orders.length}</div>
              <span className="kpi-sub-text">All time</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Orders Received</span>
                <span className="kpi-icon-emoji">⏱️</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#b45309" }}>
                {orders.filter((o) => o.status === "pending" || o.status === "order_received").length}
              </div>
              <span className="kpi-sub-text">Pending dispatch</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">In Transit</span>
                <span className="kpi-icon-emoji">🚚</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#6d28d9" }}>
                {orders.filter((o) => o.status === "shipped").length}
              </div>
              <span className="kpi-sub-text">Shipped to hub</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Out For Delivery</span>
                <span className="kpi-icon-emoji">📍</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#0e7490" }}>
                {orders.filter((o) => o.status === "out_for_delivery").length}
              </div>
              <span className="kpi-sub-text">Agent delivering today</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Completed</span>
                <span className="kpi-icon-emoji">✨</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#065f46" }}>
                {orders.filter((o) => o.status === "delivered").length}
              </div>
              <span className="kpi-sub-text">Delivered successfully</span>
            </div>

            <div
              className="admin-kpi-card"
              onClick={() => setStatusFilter("returns_exchanges")}
              style={{ cursor: "pointer", borderLeft: "4px solid #f59e0b" }}
              title="Click to view all return & exchange requests"
            >
              <div className="kpi-top-row">
                <span className="kpi-title-label">Returns & Exchanges</span>
                <span className="kpi-icon-emoji">🔄</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#d97706" }}>
                {orders.filter((o) => ["return_requested", "exchange_requested", "returned", "exchanged"].includes(o.status)).length}
              </div>
              <span className="kpi-sub-text" style={{ color: "#b45309", fontWeight: 700 }}>
                {orders.filter((o) => o.status === "return_requested" || o.status === "exchange_requested").length} pending review
              </span>
            </div>
          </div>

          {/* Toolbar: Search & Filter Tabs + Export Button */}
          <div className="admin-toolbar-card">
            <div className="admin-search-field-wrap">
              <span className="admin-search-icon-pos">🔍</span>
              <input
                type="text"
                placeholder="Search by Order ID, customer email, or return reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-tabs-row">
              {[
                { id: "all", label: "All Orders", count: orders.length },
                { id: "pending", label: "Order Received", count: orders.filter((o) => o.status === "pending" || o.status === "order_received").length },
                { id: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
                { id: "out_for_delivery", label: "Out for Delivery", count: orders.filter((o) => o.status === "out_for_delivery").length },
                { id: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
                {
                  id: "returns_exchanges",
                  label: "🔄 Returns & Exchanges",
                  count: orders.filter((o) => ["return_requested", "exchange_requested", "returned", "exchanged"].includes(o.status)).length,
                  isAlert: orders.some((o) => o.status === "return_requested" || o.status === "exchange_requested"),
                },
                { id: "cancelled", label: "Cancelled", count: orders.filter((o) => o.status === "cancelled").length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`admin-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
                  style={tab.isAlert ? { borderColor: "#f59e0b", color: "#b45309", fontWeight: 700 } : {}}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      marginLeft: "6px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      background: tab.isAlert ? "#fef3c7" : "rgba(0,0,0,0.06)",
                      color: tab.isAlert ? "#92400e" : "inherit",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}

              <button
                onClick={exportOrdersToCSV}
                className="btn-admin-export-csv"
                title="Download all orders as CSV"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Admin Orders Table */}
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>📍 Delivery Address</th>
                    <th>Items & Quantity</th>
                    <th>Total (COD)</th>
                    <th>Status & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No orders match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isUpdating = updatingId === order.id;
                      const currentStatus = order.status === "order_received" ? "pending" : order.status;

                      return (
                        <tr key={order.id} style={order.status === "return_requested" || order.status === "exchange_requested" ? { background: "#fffbeb" } : {}}>
                          <td>
                            <strong style={{ color: "var(--text-primary)", fontSize: "14px", display: "block" }}>
                              #ORD-{order.id}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              User ID #{order.user_id}
                            </span>
                            {order.created_at && (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {order.user_email || `User #${order.user_id}`}
                            </div>
                            {order.user_name && (
                              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                {order.user_name}
                              </div>
                            )}
                          </td>

                          {/* Delivery Address Column */}
                          <td>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", maxWidth: "240px" }}>
                              <span style={{ fontSize: "15px", marginTop: "1px" }}>📍</span>
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.4" }}>
                                  {order.shipping_address || "Standard Delivery Address"}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                  Method: <strong style={{ color: "#059669" }}>COD (Pay on Delivery)</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {order.items.slice(0, 2).map((item) => {
                                const pid = item.product_id ?? 0;
                                const match = catalog.find((p) => p.id === pid) || initialProducts.find((p) => p.id === pid);
                                return (
                                  <div key={item.id} style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                                    <strong style={{ color: "var(--accent-primary)" }}>{item.quantity}×</strong>{" "}
                                    {match?.name || item.product_name || `Item #${pid}`}
                                  </div>
                                );
                              })}
                              {order.items.length > 2 && (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                  +{order.items.length - 2} more items
                                </span>
                              )}
                            </div>

                            {/* Return / Exchange Request Highlight Callout */}
                            {order.status === "return_requested" && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px 10px",
                                  background: "#fef3c7",
                                  border: "1px solid #fcd34d",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  color: "#92400e",
                                }}
                              >
                                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                                  <span>⚠️</span>
                                  <span>RETURN & REFUND REQUESTED</span>
                                </div>
                                <div style={{ color: "#78350f" }}>
                                  <strong>Reason:</strong> {order.return_exchange_reason || "Customer requested return"}
                                </div>
                              </div>
                            )}

                            {order.status === "exchange_requested" && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px 10px",
                                  background: "#e0e7ff",
                                  border: "1px solid #c7d2fe",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  color: "#3730a3",
                                }}
                              >
                                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                                  <span>🔄</span>
                                  <span>EXCHANGE REPLACEMENT REQUESTED</span>
                                </div>
                                <div style={{ color: "#312e81" }}>
                                  <strong>Reason:</strong> {order.return_exchange_reason || "Customer requested replacement"}
                                </div>
                              </div>
                            )}

                            {order.status === "returned" && (
                              <div
                                style={{
                                  marginTop: "6px",
                                  padding: "4px 8px",
                                  background: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#475569",
                                  fontWeight: 700,
                                }}
                              >
                                💰 Returned & Refunded {order.return_exchange_reason ? `(${order.return_exchange_reason})` : ""}
                              </div>
                            )}

                            {order.status === "exchanged" && (
                              <div
                                style={{
                                  marginTop: "6px",
                                  padding: "4px 8px",
                                  background: "#ecfdf5",
                                  border: "1px solid #a7f3d0",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#065f46",
                                  fontWeight: 700,
                                }}
                              >
                                🔄 Replacement Exchanged {order.return_exchange_reason ? `(${order.return_exchange_reason})` : ""}
                              </div>
                            )}
                          </td>

                          <td>
                            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>
                              ₹{Number(order.total_amount).toLocaleString("en-IN")}
                            </div>
                            <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                              💵 Cash on Delivery
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <div className="admin-status-dropdown-wrap">
                                  <select
                                    disabled={isUpdating}
                                    value={currentStatus}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className={`admin-status-select ${currentStatus}`}
                                  >
                                    <option value="pending">⏱️ Order Received</option>
                                    <option value="shipped">🚚 Shipped</option>
                                    <option value="out_for_delivery">📍 Out for Delivery</option>
                                    <option value="delivered">✨ Delivered</option>
                                    <option value="return_requested">⚠️ Return Requested</option>
                                    <option value="exchange_requested">🔄 Exchange Requested</option>
                                    <option value="returned">💰 Returned & Refunded</option>
                                    <option value="exchanged">🔄 Replacement Exchanged</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                  </select>

                                  {currentStatus === "pending" && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, "shipped")}
                                      disabled={isUpdating}
                                      className="btn-admin-quick-ship"
                                      title="Mark as Shipped"
                                    >
                                      Ship →
                                    </button>
                                  )}
                                  {currentStatus === "shipped" && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, "out_for_delivery")}
                                      disabled={isUpdating}
                                      className="btn-admin-quick-ofd"
                                      title="Mark Out for Delivery"
                                    >
                                      Dispatch →
                                    </button>
                                  )}
                                  {currentStatus === "out_for_delivery" && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, "delivered")}
                                      disabled={isUpdating}
                                      className="btn-admin-quick-del"
                                      title="Mark as Delivered"
                                    >
                                      Deliver ✓
                                    </button>
                                  )}
                                </div>

                                {/* Tax Invoice Modal Trigger */}
                                <button
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  className="btn-admin-invoice-trigger"
                                  title="Print / Download Official GST Invoice"
                                >
                                  <span>🖨️</span>
                                  <span>Invoice</span>
                                </button>
                              </div>

                              {/* Quick Resolution Buttons for Return / Exchange requests */}
                              {currentStatus === "return_requested" && (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => handleStatusChange(order.id, "returned")}
                                    disabled={isUpdating}
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      borderRadius: "6px",
                                      border: "none",
                                      background: "#059669",
                                      color: "#ffffff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Approve Return & Refund ✓
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(order.id, "delivered")}
                                    disabled={isUpdating}
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#64748b",
                                      cursor: "pointer",
                                    }}
                                    title="Reject request and keep as Delivered"
                                  >
                                    Reject ✕
                                  </button>
                                </div>
                              )}

                              {currentStatus === "exchange_requested" && (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => handleStatusChange(order.id, "exchanged")}
                                    disabled={isUpdating}
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      borderRadius: "6px",
                                      border: "none",
                                      background: "#2563eb",
                                      color: "#ffffff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Approve & Dispatch Exchange ✓
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(order.id, "delivered")}
                                    disabled={isUpdating}
                                    style={{
                                      padding: "6px 10px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      borderRadius: "6px",
                                      border: "1px solid #cbd5e1",
                                      background: "#ffffff",
                                      color: "#64748b",
                                      cursor: "pointer",
                                    }}
                                    title="Reject request and keep as Delivered"
                                  >
                                    Reject ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CATALOG & INVENTORY MANAGEMENT */}
      {/* ============================================================ */}
      {activeTab === "catalog" && (
        <>
          {/* Catalog KPI bar */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Catalog Items</span>
                <span className="kpi-icon-emoji">🏷️</span>
              </div>
              <div className="kpi-number-val">{catalog.length}</div>
              <span className="kpi-sub-text">In database</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">In Stock Items</span>
                <span className="kpi-icon-emoji">🟢</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#059669" }}>
                {catalog.filter((p) => p.stock_quantity > 0).length}
              </div>
              <span className="kpi-sub-text">Available to buy</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Out of Stock</span>
                <span className="kpi-icon-emoji">🔴</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#dc2626" }}>
                {catalog.filter((p) => p.stock_quantity <= 0).length}
              </div>
              <span className="kpi-sub-text">Needs restocking</span>
            </div>
          </div>

          {/* Catalog Toolbar */}
          <div className="admin-toolbar-card">
            <div className="admin-search-field-wrap">
              <span className="admin-search-icon-pos">🔍</span>
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>

            <div className="admin-tabs-row">
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="admin-tab-btn"
                style={{ background: "#ffffff", border: "1px solid var(--border-subtle)" }}
              >
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="footwear">Footwear</option>
                <option value="accessories">Accessories</option>
              </select>

              <button
                onClick={() => setCatalogStockFilter("all")}
                className={`admin-tab-btn ${catalogStockFilter === "all" ? "active" : ""}`}
              >
                All
              </button>
              <button
                onClick={() => setCatalogStockFilter("in_stock")}
                className={`admin-tab-btn ${catalogStockFilter === "in_stock" ? "active" : ""}`}
              >
                In Stock ({catalog.filter((p) => p.stock_quantity > 0).length})
              </button>
              <button
                onClick={() => setCatalogStockFilter("out_of_stock")}
                className={`admin-tab-btn ${catalogStockFilter === "out_of_stock" ? "active" : ""}`}
              >
                Out of Stock ({catalog.filter((p) => p.stock_quantity <= 0).length})
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-add-product-main"
              >
                <span>➕</span>
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name & Category</th>
                    <th>Edit Price (₹)</th>
                    <th>Stock Units</th>
                    <th>Availability Status</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No products match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((product) => {
                      const isInStock = product.stock_quantity > 0;
                      return (
                        <tr key={product.id}>
                          <td>
                            <strong style={{ color: "var(--accent-primary)" }}>#{product.id}</strong>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                              {product.name}
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                              {product.category}
                            </span>
                          </td>

                          {/* Editable Price Column */}
                          <td>
                            <div className="price-input-inline-wrap">
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>₹</span>
                              <input
                                type="number"
                                step="0.01"
                                min="1"
                                value={product.price}
                                onChange={(e) =>
                                  handlePriceInputChange(product.id, parseFloat(e.target.value) || 0)
                                }
                                className="price-input-inline"
                                title="Edit product price (auto-saves)"
                              />
                            </div>
                          </td>

                          {/* Editable Stock Quantity Column */}
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={product.stock_quantity}
                              onChange={(e) =>
                                handleStockInputChange(product.id, parseInt(e.target.value) || 0)
                              }
                              className="stock-input-inline"
                              title="Edit stock quantity"
                            />
                          </td>

                          <td>
                            <span
                              className={`status-pill ${isInStock ? "delivered" : "cancelled"}`}
                              style={{ padding: "3px 10px", fontSize: "11px" }}
                            >
                              <span className="status-dot"></span>
                              {isInStock ? `In Stock (${product.stock_quantity})` : "Out of Stock"}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {/* Edit Modal Button */}
                              <button
                                onClick={() => openEditModal(product)}
                                className="btn-edit-product-pencil"
                                title="Edit full details"
                              >
                                ✏️ Edit
                              </button>

                              {/* Toggle Out of Stock Button */}
                              <button
                                onClick={() => handleToggleStock(product)}
                                className={`btn-toggle-stock ${isInStock ? "in-stock" : "out-of-stock"}`}
                                title={isInStock ? "Set stock to 0" : "Restock with 25 units"}
                              >
                                {isInStock ? "🔴 Mark OOS" : "🟢 Restock"}
                              </button>

                              {/* Remove Product */}
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="btn-delete-product-trash"
                                title="Remove item permanently"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: DYNAMIC COUPONS & PROMOS */}
      {/* ============================================================ */}
      {activeTab === "coupons" && (
        <>
          {/* Coupons KPI Grid */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Coupons</span>
                <span className="kpi-icon-emoji">🎟️</span>
              </div>
              <div className="kpi-number-val">{coupons.length}</div>
              <span className="kpi-sub-text">In database</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Active Promos</span>
                <span className="kpi-icon-emoji">🟢</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#059669" }}>
                {coupons.filter((c) => c.is_active).length}
              </div>
              <span className="kpi-sub-text">Currently redeemable</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Expiring Soon (≤ 5 hrs)</span>
                <span className="kpi-icon-emoji">⏳</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#d97706" }}>
                {coupons.filter((c) => {
                  if (!c.is_active) return false;
                  const diff = (new Date(c.valid_until).getTime() - Date.now()) / (1000 * 60 * 60);
                  return diff > 0 && diff <= 5;
                }).length}
              </div>
              <span className="kpi-sub-text">5-Hour urgency clock running</span>
            </div>
          </div>

          {/* Coupon Toolbar */}
          <div className="admin-toolbar-card">
            <div className="admin-search-field-wrap">
              <span className="admin-search-icon-pos">🔍</span>
              <input
                type="text"
                placeholder="Search promo codes (e.g. FLASH30)..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
              />
            </div>

            <div className="admin-tabs-row">
              <button
                onClick={() => setIsAddCouponModalOpen(true)}
                className="btn-add-product-main"
              >
                <span>➕</span>
                <span>Create Promo Code</span>
              </button>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Promo Code</th>
                    <th>Discount Offer</th>
                    <th>Min Order Requirement</th>
                    <th>Valid Until & Urgency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No coupons found. Click "Create Promo Code" to launch your first promotional discount!
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const validDate = new Date(coupon.valid_until);
                      const isExpired = validDate.getTime() <= Date.now();
                      const hoursLeft = (validDate.getTime() - Date.now()) / (1000 * 60 * 60);
                      const isUrgent = coupon.is_active && !isExpired && hoursLeft <= 5;

                      return (
                        <tr key={coupon.id}>
                          <td>
                            <div className="coupon-code-badge-admin">
                              <span style={{ fontSize: "14px" }}>🏷️</span>
                              <strong>{coupon.code}</strong>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 800, color: "var(--accent-primary)", fontSize: "15px" }}>
                              {coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `₹${coupon.discount_value.toLocaleString("en-IN")} FLAT OFF`}
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                              Type: {coupon.discount_type} discount
                            </span>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {coupon.min_order_amount > 0 ? (
                                `Above ₹${coupon.min_order_amount.toLocaleString("en-IN")}`
                              ) : (
                                <span style={{ color: "#059669" }}>No Minimum Order</span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: isExpired ? "#ef4444" : "var(--text-primary)" }}>
                                {validDate.toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {isExpired ? (
                                <span className="coupon-urgency-badge expired">⚠️ Expired</span>
                              ) : isUrgent ? (
                                <span className="coupon-urgency-badge urgent">
                                  ⏳ Last {Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m (Urgency Clock ON)
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  ({Math.round(hoursLeft / 24)} days left)
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <button
                              onClick={() => handleToggleCoupon(coupon.id)}
                              className={`status-pill ${coupon.is_active ? "delivered" : "cancelled"}`}
                              style={{ border: "none", cursor: "pointer", padding: "4px 10px" }}
                              title="Click to toggle status"
                            >
                              <span className="status-dot"></span>
                              {coupon.is_active ? "Active" : "Disabled"}
                            </button>
                          </td>

                          <td>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                              className="btn-delete-product-trash"
                              title="Delete coupon permanently"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: FLASH DEALS & DEAL OF THE DAY MANAGER */}
      {/* ============================================================ */}
      {activeTab === "deals" && (
        <>
          {/* Top Deal Metric Cards */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Active Storefront Deals</span>
                <span className="kpi-icon-emoji">⚡</span>
              </div>
              <div className="kpi-number-val" style={{ color: "var(--accent-primary)" }}>
                {flashDeals.filter((d) => d.is_active && new Date(d.ends_at).getTime() > Date.now()).length}
              </div>
              <span className="kpi-sub-text">Live on Homepage strip</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Deals Configured</span>
                <span className="kpi-icon-emoji">🏷️</span>
              </div>
              <div className="kpi-number-val">{flashDeals.length}</div>
              <span className="kpi-sub-text">Active & scheduled</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Average Discount</span>
                <span className="kpi-icon-emoji">🔥</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#d97706" }}>
                {flashDeals.length > 0
                  ? Math.round(flashDeals.reduce((sum, d) => sum + d.discount_percentage, 0) / flashDeals.length)
                  : 0}% OFF
              </div>
              <span className="kpi-sub-text">Admin pricing incentive</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Countdown Timers</span>
                <span className="kpi-icon-emoji">⏱️</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#065f46" }}>
                Real-Time
              </div>
              <span className="kpi-sub-text">Synchronized with customer view</span>
            </div>
          </div>

          {/* Flash Deals Toolbar */}
          <div className="admin-toolbar-card">
            <div className="admin-search-field-wrap">
              <span className="admin-search-icon-pos">🔍</span>
              <input
                type="text"
                placeholder="Search deals by product name, category, or ID..."
                value={dealSearch}
                onChange={(e) => setDealSearch(e.target.value)}
              />
            </div>

            <div className="admin-tabs-row">
              <button
                onClick={() => {
                  if (catalog.length > 0) {
                    setSelectedDealProductId(catalog[0].id);
                  }
                  setIsAddDealModalOpen(true);
                }}
                className="btn-hero-primary"
                style={{ padding: "9px 18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>⚡</span>
                <span>+ Add Product to Deal of the Day</span>
              </button>
            </div>
          </div>

          {/* Deals Table */}
          <div className="admin-table-container">
            <div className="admin-table-scroll">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Base Price</th>
                    <th>Discount (%)</th>
                    <th>Deal Price (₹)</th>
                    <th>Countdown Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No flash deals configured yet. Click "+ Add Product to Deal of the Day" above to feature products with custom discounts and countdown timers!
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => {
                      const endsAtTime = new Date(deal.ends_at).getTime();
                      const isExpired = endsAtTime <= Date.now();
                      const hoursLeft = Math.max(0, (endsAtTime - Date.now()) / (1000 * 60 * 60));

                      const prod = catalog.find((p) => p.id === deal.product_id) || initialProducts.find((p) => p.id === deal.product_id);
                      const basePrice = deal.original_price || prod?.price || 0;
                      const prodImage = deal.product_image || (prod as { image?: string })?.image;
                      const prodName = deal.product_name || prod?.name || `Product #${deal.product_id}`;
                      const prodCat = deal.product_category || prod?.category || "General";

                      return (
                        <tr key={deal.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {prodImage && (
                                <img
                                  src={prodImage}
                                  alt={prodName}
                                  style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", backgroundColor: "#f8fafc", padding: "2px", border: "1px solid var(--border-color)" }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                  {prodName}
                                </div>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  {prodCat} • #{deal.product_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "13px" }}>
                              ₹{basePrice.toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                background: "rgba(225, 29, 72, 0.1)",
                                color: "var(--accent-primary)",
                                fontWeight: 700,
                                fontSize: "12px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(225, 29, 72, 0.2)",
                              }}
                            >
                              -{deal.discount_percentage}% OFF
                            </span>
                          </td>

                          <td>
                            <strong style={{ color: "#065f46", fontSize: "15px" }}>
                              ₹{Math.round(deal.deal_price).toLocaleString("en-IN")}
                            </strong>
                          </td>

                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 500 }}>
                                {new Date(deal.ends_at).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isExpired ? (
                                <span className="coupon-urgency-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
                                  ⚠️ Expired
                                </span>
                              ) : hoursLeft <= 5 ? (
                                <span className="coupon-urgency-badge urgent">
                                  ⏳ Last {Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m left
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  ({Math.round(hoursLeft / 24)}d {Math.floor(hoursLeft % 24)}h left)
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <button
                              onClick={() => handleToggleDeal(deal.id)}
                              className={`status-pill ${deal.is_active && !isExpired ? "delivered" : "cancelled"}`}
                              style={{ border: "none", cursor: "pointer", padding: "4px 10px" }}
                              title="Click to pause or activate deal"
                            >
                              <span className="status-dot"></span>
                              {deal.is_active && !isExpired ? "Live" : deal.is_active ? "Expired" : "Paused"}
                            </button>
                          </td>

                          <td>
                            <button
                              onClick={() => handleDeleteDeal(deal.id, prod?.name)}
                              className="btn-delete-product-trash"
                              title="Remove from flash deals"
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SALES ANALYTICS & CSV EXPORT */}
      {/* ============================================================ */}
      {activeTab === "analytics" && (
        <div className="admin-analytics-view-wrapper">
          {/* Top Level Metric KPIs */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Realized Revenue</span>
                <span className="kpi-icon-emoji">💰</span>
              </div>
              <div className="kpi-number-val">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </div>
              <span className="kpi-sub-text">From non-cancelled orders</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Average Order Value (AOV)</span>
                <span className="kpi-icon-emoji">📈</span>
              </div>
              <div className="kpi-number-val">
                ₹{avgOrderValue.toLocaleString("en-IN")}
              </div>
              <span className="kpi-sub-text">Average basket size</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Total Units Sold</span>
                <span className="kpi-icon-emoji">🛍️</span>
              </div>
              <div className="kpi-number-val" style={{ color: "#2563eb" }}>
                {totalItemsSold} Units
              </div>
              <span className="kpi-sub-text">Across all categories</span>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-top-row">
                <span className="kpi-title-label">Export Full Ledger</span>
                <span className="kpi-icon-emoji">📊</span>
              </div>
              <button
                onClick={exportOrdersToCSV}
                className="btn-hero-primary"
                style={{ marginTop: "8px", padding: "8px 14px", fontSize: "13px", width: "100%", justifyContent: "center" }}
              >
                📥 Download CSV
              </button>
              <span className="kpi-sub-text" style={{ marginTop: "4px" }}>Audit-ready format</span>
            </div>
          </div>

          {/* Charts & Leaderboard Row */}
          <div className="analytics-dual-section-grid">
            {/* Category Performance Breakdown */}
            <div className="analytics-card-container">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">🏷️ Category Sales Distribution</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>By gross revenue</span>
              </div>

              <div className="category-bars-list">
                {Object.entries(categoryStats).length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                    No order data yet.
                  </p>
                ) : (
                  Object.entries(categoryStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([cat, data]) => {
                      const pct = Math.round((data.revenue / maxCatRev) * 100);
                      return (
                        <div key={cat} className="analytics-category-bar-row">
                          <div className="category-bar-header">
                            <span className="cat-name-label">{cat}</span>
                            <span className="cat-revenue-label">
                              ₹{data.revenue.toLocaleString("en-IN")}{" "}
                              <small style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                                ({data.itemsCount} units)
                              </small>
                            </span>
                          </div>
                          <div className="analytics-bar-track">
                            <div className="analytics-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Top 5 Products Leaderboard */}
            <div className="analytics-card-container">
              <div className="analytics-card-header">
                <h3 className="analytics-card-title">🏆 Top Selling Products Leaderboard</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ranked by revenue</span>
              </div>

              <div className="leaderboard-table-wrap">
                {topProductsLeaderboard.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                    No product sales registered yet.
                  </p>
                ) : (
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Product</th>
                        <th>Units</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsLeaderboard.map((item, idx) => (
                        <tr key={item.id}>
                          <td>
                            <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.category}</span>
                          </td>
                          <td>
                            <strong>{item.units}</strong>
                          </td>
                          <td>
                            <strong style={{ color: "var(--accent-primary)" }}>
                              ₹{item.revenue.toLocaleString("en-IN")}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD COUPON MODAL */}
      {/* ============================================================ */}
      {isAddCouponModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setIsAddCouponModalOpen(false)}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3 className="product-modal-title">Create New Promo Code</h3>
              <p className="product-modal-sub">
                Configure discount percentages, minimum order thresholds, and 5-hour urgency expiration timers.
              </p>
            </div>

            <form onSubmit={handleAddCoupon} className="product-form-grid">
              <div className="form-group-field">
                <label>Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH30, MEGA500"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group-field">
                  <label>Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as "percentage" | "flat")}
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount Discount (₹)</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Discount Value {newDiscountType === "percentage" ? "(%)" : "(₹)"}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder={newDiscountType === "percentage" ? "e.g. 30" : "e.g. 500"}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 for no minimum"
                  value={newMinOrderAmount}
                  onChange={(e) => setNewMinOrderAmount(e.target.value)}
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Discount will only trigger if cart subtotal is greater than or equal to this amount.
                </span>
              </div>

              <div className="form-group-field">
                <label>Valid Until (Date & Time)</label>
                <input
                  type="datetime-local"
                  required
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(d.getHours() + 4);
                      setNewValidUntil(d.toISOString().slice(0, 16));
                    }}
                  >
                    ⚡ Test 4 Hours (Urgency ON)
                  </button>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setNewValidUntil(d.toISOString().slice(0, 16));
                    }}
                  >
                    📅 +7 Days
                  </button>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setIsAddCouponModalOpen(false)}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCoupon}
                  className="btn-hero-primary"
                  style={{ padding: "10px 20px", fontSize: "13px" }}
                >
                  {isSavingCoupon ? "Creating..." : "Create Promo Code ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT FLASH DEAL MODAL */}
      {/* ============================================================ */}
      {isAddDealModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setIsAddDealModalOpen(false)}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3 className="product-modal-title">⚡ Feature Product in Deal of the Day</h3>
              <p className="product-modal-sub">
                Admin-controlled deal pricing, custom discount percentage, and synchronized live countdown timer.
              </p>
            </div>

            <form onSubmit={handleAddDeal} className="product-form-grid">
              <div className="form-group-field">
                <label>Select Product from Catalog</label>
                <select
                  value={selectedDealProductId}
                  onChange={(e) => setSelectedDealProductId(parseInt(e.target.value))}
                  required
                >
                  {catalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.name} (Base Price: ₹{p.price.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-two-col">
                <div className="form-group-field">
                  <label>Discount Percentage (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="99"
                    required
                    placeholder="e.g. 35"
                    value={dealDiscountPercent}
                    onChange={(e) => setDealDiscountPercent(e.target.value)}
                  />
                </div>

                <div className="form-group-field">
                  <label>Effective Deal Price (Preview)</label>
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      color: "#065f46",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {(() => {
                      const prod = catalog.find((p) => p.id === selectedDealProductId);
                      const base = prod?.price || 0;
                      const disc = parseFloat(dealDiscountPercent) || 0;
                      const calculated = Math.round(base * (1 - disc / 100));
                      return `₹${calculated.toLocaleString("en-IN")} (Save ₹${(base - calculated).toLocaleString("en-IN")})`;
                    })()}
                  </div>
                </div>
              </div>

              <div className="form-group-field">
                <label>Deal Expiry (Date & Time Countdown)</label>
                <input
                  type="datetime-local"
                  required
                  value={dealEndsAt}
                  onChange={(e) => setDealEndsAt(e.target.value)}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(d.getHours() + 4);
                      setDealEndsAt(d.toISOString().slice(0, 16));
                    }}
                  >
                    ⚡ 4 Hours Flash
                  </button>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(d.getHours() + 12);
                      setDealEndsAt(d.toISOString().slice(0, 16));
                    }}
                  >
                    ⏱️ 12 Hours Deal
                  </button>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(d.getHours() + 24);
                      setDealEndsAt(d.toISOString().slice(0, 16));
                    }}
                  >
                    ☀️ 24 Hours (Full Day)
                  </button>
                  <button
                    type="button"
                    className="btn-quick-date"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setDealEndsAt(d.toISOString().slice(0, 16));
                    }}
                  >
                    📅 3-Day Weekend Special
                  </button>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setIsAddDealModalOpen(false)}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDeal}
                  className="btn-hero-primary"
                  style={{ padding: "10px 20px", fontSize: "13px" }}
                >
                  {isSavingDeal ? "Saving Deal..." : "Activate Deal on Storefront ⚡"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD PRODUCT MODAL */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="product-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3 className="product-modal-title">Add New Product to Catalog</h3>
              <p className="product-modal-sub">
                This item will be saved in the database and immediately available in the storefront.
              </p>
            </div>

            <form onSubmit={handleAddProduct} className="product-form-grid">
              <div className="form-group-field">
                <label>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group-field">
                  <label>Category</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Price in INR (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 24999"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 25 (Set 0 for Out of Stock)"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="btn-hero-primary"
                  style={{ padding: "10px 20px", fontSize: "13px" }}
                >
                  {isAddingProduct ? "Adding Product..." : "Save Product ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT PRODUCT MODAL */}
      {/* ============================================================ */}
      {editingProduct && (
        <div className="product-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-header">
              <h3 className="product-modal-title">Edit Product #{editingProduct.id}</h3>
              <p className="product-modal-sub">
                Modify product details, pricing, and inventory in the database.
              </p>
            </div>

            <form onSubmit={handleSaveProductEdit} className="product-form-grid">
              <div className="form-group-field">
                <label>Product Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group-field">
                  <label>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Price in INR (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group-field">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn-hero-primary"
                  style={{ padding: "10px 20px", fontSize: "13px" }}
                >
                  {isSavingEdit ? "Saving..." : "Update Product ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INVOICE MODAL */}
      {/* ============================================================ */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};

