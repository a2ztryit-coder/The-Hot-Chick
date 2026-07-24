import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  clearAllData,
  deleteCategory,
  deleteMenuItem,
  getCategories,
  getMenuItems,
  getOrders,
  getSettings,
  initDatabase,
  saveCategory,
  saveMenuItem,
  saveOrder,
  saveSettings,
} from "./db";

function currency(value) {
  return `Rs ${Number(value || 0).toFixed(2)}`;
}

function dateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function istDateKey(value) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function todayKey() {
  return istDateKey(new Date());
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyItemForm(categoryId = "") {
  return {
    id: "",
    name: "",
    categoryId,
    sellingPrice: "",
    costPrice: "",
    enabled: true,
  };
}

function StatCard({ label, value, tone = "default" }) {
  return (
    <div className={`stat ${tone !== "default" ? `stat-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cashier");
  const [billOpen, setBillOpen] = useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState("dinein");
  const [discount, setDiscount] = useState("0");
  const [parcelChargeInput, setParcelChargeInput] = useState("20");
  const [orderPreviewOpen, setOrderPreviewOpen] = useState(false);
  const [orderSuccessFlash, setOrderSuccessFlash] = useState(false);

  const [adminSection, setAdminSection] = useState("items");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState({});
  const [itemForm, setItemForm] = useState(emptyItemForm());
  const [adminParcelPrice, setAdminParcelPrice] = useState("20");
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  async function loadAll() {
    await initDatabase();
    const [nextSettings, nextCategories, nextMenuItems, nextOrders] = await Promise.all([
      getSettings(),
      getCategories(),
      getMenuItems(),
      getOrders(),
    ]);

    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setCategories(nextCategories.sort((a, b) => a.name.localeCompare(b.name)));
    setMenuItems(nextMenuItems.sort((a, b) => a.name.localeCompare(b.name)));
    setOrders(nextOrders.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO)));
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#fc8019");
  }, []);

  useEffect(() => {
    if (!settings) return;
    setParcelChargeInput(String(settings.parcelCharge ?? 20));
    setAdminParcelPrice(String(settings.parcelCharge ?? 20));
  }, [settings]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
    }

    function handleAppInstalled() {
      setInstallPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!categoryDropdownRef.current) return;
      if (!categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const enabledCategoryIds = useMemo(
    () => new Set(categories.filter((category) => category.enabled).map((category) => category.id)),
    [categories]
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories]
  );

  const cashierItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.enabled) return false;
      if (!enabledCategoryIds.has(item.categoryId)) return false;
      if (selectedCategory !== "all" && item.categoryId !== selectedCategory) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [enabledCategoryIds, menuItems, search, selectedCategory]);

  const cartRows = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, qty]) => {
        const item = menuItems.find((candidate) => candidate.id === itemId);
        if (!item || qty <= 0) return null;

        return {
          itemId,
          name: item.name,
          qty,
          price: Number(item.sellingPrice),
          costPrice: Number(item.costPrice),
          lineTotal: Number(item.sellingPrice) * qty,
        };
      })
      .filter(Boolean);
  }, [cart, menuItems]);

  const cartItemCount = useMemo(
    () => cartRows.reduce((total, row) => total + Number(row.qty || 0), 0),
    [cartRows]
  );

  const subtotal = useMemo(
    () => cartRows.reduce((total, row) => total + Number(row.lineTotal || 0), 0),
    [cartRows]
  );

  const discountValue = Math.max(0, Number(discount) || 0);
  const parcelCharge = orderType === "parcel" ? Math.max(0, Number(parcelChargeInput) || 0) : 0;
  const grandTotal = Math.max(0, subtotal + parcelCharge - discountValue);

  const todayOrders = useMemo(
    () => orders.filter((order) => istDateKey(order.dateISO) === todayKey()),
    [orders]
  );

  const orderSerialMap = useMemo(() => {
    const ascending = [...todayOrders].sort(
      (a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
    );
    return Object.fromEntries(ascending.map((order, index) => [order.id, index + 1]));
  }, [todayOrders]);

  const report = useMemo(() => {
    const summary = {
      totalOrders: todayOrders.length,
      parcelOrders: 0,
      dineInOrders: 0,
      totalRevenue: 0,
      totalCost: 0,
      net: 0,
      bestSellingItem: "-",
      itemWise: {},
    };

    for (const order of todayOrders) {
      if (order.orderType === "parcel") summary.parcelOrders += 1;
      else summary.dineInOrders += 1;

      summary.totalRevenue += Number(order.total || 0);
      summary.totalCost += Number(order.costTotal || 0);

      for (const row of order.items || []) {
        if (!summary.itemWise[row.name]) {
          summary.itemWise[row.name] = { qty: 0, amount: 0 };
        }

        summary.itemWise[row.name].qty += Number(row.qty || 0);
        summary.itemWise[row.name].amount += Number(row.qty || 0) * Number(row.price || 0);
      }
    }

    summary.net = summary.totalRevenue - summary.totalCost;

    let topQty = 0;
    for (const [name, data] of Object.entries(summary.itemWise)) {
      if (data.qty > topQty) {
        topQty = data.qty;
        summary.bestSellingItem = `${name} (${data.qty})`;
      }
    }

    return summary;
  }, [todayOrders]);

  const visibleOrders = useMemo(
    () => (showAllOrders ? todayOrders : todayOrders.slice(0, 1)),
    [showAllOrders, todayOrders]
  );
  const totalDisabledItems = useMemo(
    () => menuItems.filter((item) => !item.enabled).length,
    [menuItems]
  );

  const selectedCategoryName = useMemo(() => {
    if (!itemForm.categoryId) return "Select category";
    return categories.find((category) => category.id === itemForm.categoryId)?.name || "Select category";
  }, [categories, itemForm.categoryId]);

  function addToCart(itemId) {
    setCart((prev) => ({ ...prev, [itemId]: Number(prev[itemId] || 0) + 1 }));
  }

  function changeQty(itemId, delta) {
    setCart((prev) => {
      const nextQty = Number(prev[itemId] || 0) + delta;
      const nextCart = { ...prev };

      if (nextQty <= 0) delete nextCart[itemId];
      else nextCart[itemId] = nextQty;

      return nextCart;
    });
  }

  function removeItem(itemId) {
    setCart((prev) => {
      const nextCart = { ...prev };
      delete nextCart[itemId];
      return nextCart;
    });
  }

  function clearBill() {
    setCart({});
    setDiscount("0");
    setOrderType("dinein");
    setParcelChargeInput(String(settings?.parcelCharge ?? 20));
    setBillOpen(false);
  }

  function openOrderPreview() {
    if (!cartRows.length) {
      alert("Add at least one item before confirming the order.");
      return;
    }

    setOrderPreviewOpen(true);
  }

  async function saveCurrentOrder() {
    if (!cartRows.length) {
      alert("Add at least one item before saving the order.");
      return;
    }

    const order = {
      id: uid("order"),
      dateISO: new Date().toISOString(),
      orderType,
      parcelCharge,
      discount: discountValue,
      subtotal,
      total: grandTotal,
      costTotal: cartRows.reduce(
        (total, row) => total + Number(row.qty || 0) * Number(row.costPrice || 0),
        0
      ),
      items: cartRows.map((row) => ({
        itemId: row.itemId,
        name: row.name,
        qty: row.qty,
        price: row.price,
        costPrice: row.costPrice,
      })),
    };

    await saveOrder(order);
    await loadAll();
    clearBill();
    setOrderPreviewOpen(false);
    setOrderSuccessFlash(true);
    setTimeout(() => setOrderSuccessFlash(false), 1300);
  }

  async function saveSettingsFromDraft() {
    const nextSettings = {
      ...settingsDraft,
      parcelCharge: Math.max(0, Number(settingsDraft.parcelCharge) || 0),
    };

    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setParcelChargeInput(String(nextSettings.parcelCharge));
    alert("Settings saved.");
  }

  async function saveDefaultParcelPrice() {
    const nextParcelCharge = Math.max(0, Number(adminParcelPrice) || 0);
    const nextSettings = { ...settings, parcelCharge: nextParcelCharge };

    await saveSettings(nextSettings);
    setSettings(nextSettings);
    setSettingsDraft((prev) => ({ ...prev, parcelCharge: nextParcelCharge }));
    setParcelChargeInput(String(nextParcelCharge));
    alert("Default parcel price updated.");
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    await saveCategory({ id: uid("cat"), name, enabled: true });
    setNewCategoryName("");
    await loadAll();
  }

  async function handleUpdateCategory(category) {
    const nextName = (editingCategory[category.id] ?? category.name).trim();
    if (!nextName) {
      alert("Category name cannot be empty.");
      return;
    }

    await saveCategory({ ...category, name: nextName });
    await loadAll();
  }

  async function handleDeleteCategory(categoryId) {
    if (menuItems.some((item) => item.categoryId === categoryId)) {
      alert("Category has menu items. Move or delete those items first.");
      return;
    }

    if (!window.confirm("Delete this category?")) return;
    await deleteCategory(categoryId);
    await loadAll();
  }

  function resetItemForm() {
    setItemForm(emptyItemForm(""));
  }

  async function saveItemForm() {
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      alert("Item name and category are required.");
      return;
    }

    await saveMenuItem({
      id: itemForm.id || uid("item"),
      name: itemForm.name.trim(),
      categoryId: itemForm.categoryId,
      sellingPrice: Math.max(0, Number(itemForm.sellingPrice) || 0),
      costPrice: Math.max(0, Number(itemForm.costPrice) || 0),
      enabled: Boolean(itemForm.enabled),
    });

    resetItemForm();
    await loadAll();
  }

  async function exportReportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Daily Closing Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Date: ${todayKey()}`, 14, 26);
    doc.text(`Shop: ${settings.shopName}`, 14, 32);

    const itemRows = Object.entries(report.itemWise).map(([name, data]) => [
      name,
      String(data.qty),
      currency(data.amount),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Value"]],
      body: [
        ["Today Sales", currency(report.totalRevenue)],
        ["Total Orders", String(report.totalOrders)],
        ["Parcel Orders", String(report.parcelOrders)],
        ["Dine-in Orders", String(report.dineInOrders)],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Item", "Qty", "Sales"]],
      body: itemRows.length ? itemRows : [["No sales", "0", currency(0)]],
      theme: "striped",
      styles: { fontSize: 10 },
    });

    const orderRows = todayOrders.map((order, index) => {
      const itemCount = (order.items || []).reduce(
        (total, item) => total + Number(item.qty || 0),
        0
      );
      const itemSummary = (order.items || [])
        .map((item) => `${item.name} x ${item.qty}`)
        .join(", ");

      return [
        `Order ${orderSerialMap[order.id] ?? index + 1}`,
        dateTime(order.dateISO),
        order.orderType === "parcel" ? "Parcel" : "Dine-in",
        String(itemCount),
        itemSummary || "-",
        currency(order.total),
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Order", "Time (IST)", "Type", "Item Count", "Items", "Total"]],
      body: orderRows.length ? orderRows : [["-", "-", "-", "0", "No orders", currency(0)]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, valign: "top" },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 34 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 66 },
        5: { cellWidth: 24, halign: "right" },
      },
    });

    doc.save(`daily-report-${todayKey()}.pdf`);
  }

  async function handleInstallApp() {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  }

  if (loading || !settings || !settingsDraft) {
    return <div className="center">Loading POS...</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{settings.shopName}</h1>
        </div>

        <div className="header-actions">
          {installPromptEvent ? (
            <button className="btn btn-primary" onClick={handleInstallApp}>
              Install App
            </button>
          ) : null}
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "cashier" ? "tab active" : "tab"} onClick={() => setTab("cashier")}>
          Cashier
        </button>
        <button className={tab === "reports" ? "tab active" : "tab"} onClick={() => setTab("reports")}>
          Reports
        </button>
        <button className={tab === "admin" ? "tab active" : "tab"} onClick={() => setTab("admin")}>
          Admin
        </button>
      </nav>

      {tab === "cashier" && (
        <section className="grid-2 cashier-layout">
          <div className="panel menu-panel">
            <div className="cashier-toolbar">
              <div>
                <h2>Food Order</h2>
              </div>

              <div className="toolbar-actions">
                <button
                  className={orderType === "dinein" ? "btn active-solid" : "btn"}
                  onClick={() => setOrderType("dinein")}
                >
                  Dine-in
                </button>
                <button
                  className={orderType === "parcel" ? "btn active-solid" : "btn"}
                  onClick={() => setOrderType("parcel")}
                >
                  Parcel
                </button>
              </div>
            </div>

            <input
              className="input search-input"
              placeholder="Search for rolls, burgers, fries..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="category-chips">
              <button
                className={selectedCategory === "all" ? "chip active" : "chip"}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </button>
              {categories
                .filter((category) => category.enabled)
                .map((category) => (
                  <button
                    key={category.id}
                    className={selectedCategory === category.id ? "chip active" : "chip"}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
            </div>

            <div className="menu-grid swiggy-menu-grid">
              {cashierItems.map((item) => {
                const qty = Number(cart[item.id] || 0);

                return (
                  <div key={item.id} className="menu-card">
                    <div className="menu-copy">
                      <span className="menu-category">
                        {categoryMap[item.categoryId]?.name || "Unassigned"}
                      </span>
                      <h3>{item.name}</h3>
                      <strong>{currency(item.sellingPrice)}</strong>
                    </div>

                    <div className="menu-action-area">
                      {qty > 0 ? (
                        <div className="inline-qty-control">
                          <button className="tiny" onClick={() => changeQty(item.id, -1)}>
                            -
                          </button>
                          <span>{qty}</span>
                          <button className="tiny" onClick={() => changeQty(item.id, 1)}>
                            +
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-primary add-btn" onClick={() => addToCart(item.id)}>
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!cashierItems.length && (
                <div className="empty-card">
                  <h3>No matching items</h3>
                  <p>Try another search or enable more items from Admin.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bill-column">
            <div className="panel bill-panel">
              <div className="panel-head bill-panel-head">
                <div className="bill-title-wrap">
                  <h2>Review Order</h2>
                  <p className="bill-meta">{cartItemCount} items</p>
                </div>
              </div>

              {orderType === "parcel" && (
                <div className="inline-field-row bill-inline-field-row">
                  <span className="field-label">Parcel Charge</span>
                  <strong>{currency(parcelCharge)}</strong>
                </div>
              )}

              <div className="bill-list">
                {cartRows.map((row) => (
                  <div className="bill-row" key={row.itemId}>
                    <div className="bill-copy">
                      <h3>{row.name}</h3>
                      <p>{currency(row.price)} each</p>
                    </div>
                    <div className="bill-side">
                      <span className="qty-pill">x{row.qty}</span>
                      <strong>{currency(row.lineTotal)}</strong>
                    </div>
                  </div>
                ))}

                {!cartRows.length && (
                  <div className="empty-card compact">
                    <h3>Order is empty</h3>
                    <p>Tap the large menu buttons to add items.</p>
                  </div>
                )}
              </div>

              <div className="totals">
                <div className="line">
                  <span>Subtotal</span>
                  <strong>{currency(subtotal)}</strong>
                </div>
                <div className="line">
                  <span>Parcel Charge</span>
                  <strong>{currency(parcelCharge)}</strong>
                </div>
                <div className="line grand">
                  <span>Grand Total</span>
                  <strong>{currency(grandTotal)}</strong>
                </div>
              </div>

              <button
                className={`bill-btn ${orderPreviewOpen ? "bill-btn-preview" : ""} ${orderSuccessFlash ? "bill-btn-success" : ""}`}
                onClick={openOrderPreview}
              >
                Confirm Order
              </button>
            </div>

            {orderPreviewOpen && (
              <div className="order-preview-overlay" onClick={() => setOrderPreviewOpen(false)}>
                <div className="order-preview-modal" onClick={(event) => event.stopPropagation()}>
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Order Preview</p>
                      <h3>{orderType === "parcel" ? "Parcel Order" : "Dine-in Order"}</h3>
                    </div>
                  </div>

                  <div className="order-preview-block">
                    <p className="order-preview-title">Items</p>
                    <div className="order-preview-lines">
                      {cartRows.map((row) => (
                        <div className="line" key={`preview-${row.itemId}`}>
                          <span>
                            {row.name} x {row.qty}
                          </span>
                          <strong>{currency(row.lineTotal)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-preview-block order-preview-totals-block">
                    <p className="order-preview-title">Totals</p>
                    <div className="totals">
                      <div className="line">
                        <span>Subtotal</span>
                        <strong>{currency(subtotal)}</strong>
                      </div>
                      <div className="line">
                        <span>Parcel Charge</span>
                        <strong>{currency(parcelCharge)}</strong>
                      </div>
                      <div className="line grand">
                        <span>Grand Total</span>
                        <strong>{currency(grandTotal)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="order-preview-actions">
                    <button className="btn" onClick={() => setOrderPreviewOpen(false)}>
                      Back
                    </button>
                    <button className="btn order-final-btn" onClick={saveCurrentOrder}>
                      Confirm & Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "reports" && (
        <section className="reports-layout">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Daily Closing</p>
                <h2>Today Report ({todayKey()})</h2>
              </div>
            </div>

            <div className="stats-grid reports-stats">
              <StatCard label="Today Sales" value={currency(report.totalRevenue)} tone="accent" />
              <StatCard label="Parcel Orders" value={report.parcelOrders} />
              <StatCard label="Total Orders" value={report.totalOrders} />
              <StatCard label="Dine-in Orders" value={report.dineInOrders} />
            </div>
          </div>

          <div className="grid-2 report-grid">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Item-wise Sales</p>
                  <h2>Sales Breakdown</h2>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.itemWise).map(([name, data]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{data.qty}</td>
                        <td>{currency(data.amount)}</td>
                      </tr>
                    ))}

                    {!Object.keys(report.itemWise).length && (
                      <tr>
                        <td colSpan="3">No sales today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Recent Orders</p>
                  <h2>Orders</h2>
                </div>
              </div>

              <div className="order-timeline">
                {visibleOrders.map((order, index) => (
                  <div className="token-card" key={order.id}>
                    <div className="timeline-row">
                      <div>
                        <strong>
                          Order {orderSerialMap[order.id] ?? index + 1} • {order.orderType === "parcel" ? "Parcel" : "Dine-in"}
                        </strong>
                        <p>
                          {dateTime(order.dateISO)}
                        </p>
                      </div>
                      <strong>{currency(order.total)}</strong>
                    </div>

                    <div className="token-items">
                      {(order.items || []).map((item) => (
                        <div className="token-item-row" key={`${order.id}-${item.itemId}`}>
                          <span>
                            {item.name} x {item.qty}
                          </span>
                          <strong>{currency(Number(item.qty || 0) * Number(item.price || 0))}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {!visibleOrders.length && (
                  <div className="empty-card compact">
                    <h3>No orders yet</h3>
                    <p>Save orders from Cashier to see today's report.</p>
                  </div>
                )}

                {todayOrders.length > 1 && (
                  <button className="btn" onClick={() => setShowAllOrders((prev) => !prev)}>
                    {showAllOrders ? "Show Less" : `Show More (${todayOrders.length - 1} more)`}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="reports-export-bottom">
            <button className="btn btn-primary" onClick={exportReportPdf}>
              Export PDF
            </button>
          </div>
        </section>
      )}

      {tab === "admin" && (
        <section className="panel">
          <div className="admin-grid">
            <div className="admin-topbar admin-card">
              <div>
                <p className="eyebrow">Admin</p>
                <h3>{settings.shopName}</h3>
              </div>
            </div>

            <nav className="admin-quick-nav simple-admin-nav">
              <button
                className={adminSection === "categories" ? "chip active" : "chip"}
                onClick={() => setAdminSection("categories")}
              >
                Categories
              </button>
              <button
                className={adminSection === "items" ? "chip active" : "chip"}
                onClick={() => setAdminSection("items")}
              >
                Items
              </button>
              <button
                className={adminSection === "settings" ? "chip active" : "chip"}
                onClick={() => setAdminSection("settings")}
              >
                Settings
              </button>
              <button
                className={adminSection === "tools" ? "chip active" : "chip"}
                onClick={() => setAdminSection("tools")}
              >
                Reset
              </button>
            </nav>

              {adminSection === "categories" && (
                <div className="admin-card admin-content-card">
                  <div className="section-title">
                    <div>
                      <h3>Categories</h3>
                    </div>
                  </div>

                  <div className="admin-inline-form">
                    <div className="field-stack field-grow">
                      <label className="field-caption">New category</label>
                      <input
                        className="input"
                        placeholder="Example: Sandwiches"
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                      />
                    </div>
                    <button className="btn" onClick={handleAddCategory}>
                      Add
                    </button>
                  </div>

                  <div className="stack-list">
                    {categories.map((category) => (
                      <div className="list-row admin-list-row" key={category.id}>
                        <div className="field-stack field-grow">
                          <label className="field-caption">Category name</label>
                          <input
                            className="input"
                            value={editingCategory[category.id] ?? category.name}
                            onChange={(event) =>
                              setEditingCategory((prev) => ({
                                ...prev,
                                [category.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <label className="toggle-switch admin-switch">
                          <input
                            type="checkbox"
                            checked={category.enabled}
                            onChange={async (event) => {
                              await saveCategory({ ...category, enabled: event.target.checked });
                              await loadAll();
                            }}
                          />
                          <span className="toggle-slider" />
                          <span className="toggle-label">{category.enabled ? "On" : "Off"}</span>
                        </label>
                        <div className="row gap wrap admin-action-row">
                          <button
                            className="btn icon-btn"
                            title="Save category"
                            aria-label="Save category"
                            onClick={() => handleUpdateCategory(category)}
                          >
                            ✓
                          </button>
                          <button
                            className="btn danger icon-btn"
                            title="Delete category"
                            aria-label="Delete category"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSection === "items" && (
                <div className="admin-card admin-content-card">
                  <div className="section-title">
                    <div>
                      <h3>Items</h3>
                    </div>
                  </div>

                  <div className="admin-inline-form">
                    <div className="field-stack field-grow">
                      <label className="field-caption">Default parcel price</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        placeholder="Default parcel price"
                        aria-label="Default parcel price"
                        value={adminParcelPrice}
                        onChange={(event) => setAdminParcelPrice(event.target.value)}
                      />
                    </div>
                    <button className="btn" onClick={saveDefaultParcelPrice}>
                      Update Default Parcel Price
                    </button>
                  </div>

                  <div className="admin-items-layout">
                    <div className="admin-subcard">
                      <div className="section-title small-section-title">
                        <h3>{itemForm.id ? "Update Item" : "Add Item"}</h3>
                      </div>

                      <div className="form-grid">
                        <div className="field-stack">
                          <label className="field-caption">Item name</label>
                          <input
                            className="input"
                            placeholder="Example: Paneer Burger"
                            value={itemForm.name}
                            onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                          />
                        </div>
                        <div className="field-stack">
                          <label className="field-caption">Category</label>
                          <div className="custom-select" ref={categoryDropdownRef}>
                            <button
                              type="button"
                              className="input select-trigger"
                              aria-haspopup="listbox"
                              aria-expanded={categoryDropdownOpen}
                              onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                            >
                              <span>{selectedCategoryName}</span>
                              <span className="select-arrow">⌄</span>
                            </button>

                            {categoryDropdownOpen && (
                              <div className="select-menu" role="listbox">
                                <button
                                  type="button"
                                  className={itemForm.categoryId === "" ? "select-option active" : "select-option"}
                                  onClick={() => {
                                    setItemForm((prev) => ({ ...prev, categoryId: "" }));
                                    setCategoryDropdownOpen(false);
                                  }}
                                >
                                  Select category
                                </button>
                                {categories.map((category) => (
                                  <button
                                    key={category.id}
                                    type="button"
                                    className={
                                      itemForm.categoryId === category.id
                                        ? "select-option active"
                                        : "select-option"
                                    }
                                    onClick={() => {
                                      setItemForm((prev) => ({ ...prev, categoryId: category.id }));
                                      setCategoryDropdownOpen(false);
                                    }}
                                  >
                                    {category.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="price-grid">
                      <div className="field-stack">
                          <label className="field-caption price-label">Sell Price</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          placeholder="Sell price"
                          value={itemForm.sellingPrice}
                          onChange={(event) =>
                            setItemForm((prev) => ({ ...prev, sellingPrice: event.target.value }))
                          }
                        />
                      </div>
                      <div className="field-stack">
                          <label className="field-caption price-label">Food Price</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          placeholder="Food price"
                          value={itemForm.costPrice}
                          onChange={(event) =>
                            setItemForm((prev) => ({ ...prev, costPrice: event.target.value }))
                          }
                        />
                      </div>
                        </div>
                        <label className="toggle-switch admin-switch">
                          <input
                            type="checkbox"
                            checked={itemForm.enabled}
                            onChange={(event) =>
                              setItemForm((prev) => ({ ...prev, enabled: event.target.checked }))
                            }
                          />
                          <span className="toggle-slider" />
                          <span className="toggle-label">{itemForm.enabled ? "On" : "Off"}</span>
                        </label>
                        <div className="row gap wrap">
                          <button className="btn btn-primary" onClick={saveItemForm}>
                            {itemForm.id ? "Update Item" : "Save Item"}
                          </button>
                          <button className="btn" onClick={resetItemForm}>
                            Clear Form
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="admin-subcard">
                      <div className="section-title small-section-title">
                        <h3>Available Items</h3>
                      </div>

                      <div className="table-wrap admin-table-wrap">
                        <div className="admin-item-card-list">
                          {menuItems.map((item) => (
                            <div className="admin-item-card" key={item.id}>
                              <div className="admin-item-copy">
                                <strong>{item.name}</strong>
                                <span>{categoryMap[item.categoryId]?.name || "-"}</span>
                                <span>
                                  Sell Price: {currency(item.sellingPrice)} • Food Price: {currency(item.costPrice)}
                                </span>
                                <span>Status: {item.enabled ? "On" : "Off"}</span>
                              </div>

                              <div className="admin-item-actions">
                                <button
                                  className="btn btn-primary icon-btn"
                                  title="Edit item"
                                  aria-label="Edit item"
                                  onClick={() =>
                                    setItemForm({
                                      ...item,
                                      sellingPrice: String(item.sellingPrice),
                                      costPrice: String(item.costPrice),
                                    })
                                  }
                                >
                                  ✎
                                </button>
                                <label className="toggle-switch compact-switch">
                                  <input
                                    type="checkbox"
                                    checked={item.enabled}
                                    onChange={async (event) => {
                                      await saveMenuItem({ ...item, enabled: event.target.checked });
                                      await loadAll();
                                    }}
                                  />
                                  <span className="toggle-slider" />
                                </label>
                                <button
                                  className="btn danger icon-btn"
                                  title="Delete item"
                                  aria-label="Delete item"
                                  onClick={async () => {
                                    if (!window.confirm(`Delete ${item.name}?`)) return;
                                    await deleteMenuItem(item.id);
                                    await loadAll();
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSection === "settings" && (
                <div className="admin-card admin-content-card">
                  <div className="section-title">
                    <div>
                      <h3>Settings</h3>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field-stack">
                      <label className="field-caption">Shop name</label>
                      <input
                        className="input"
                        placeholder="Shop Name"
                        value={settingsDraft.shopName}
                        onChange={(event) =>
                          setSettingsDraft((prev) => ({ ...prev, shopName: event.target.value }))
                        }
                      />
                    </div>
                    <button className="btn btn-primary" onClick={saveSettingsFromDraft}>
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {adminSection === "tools" && (
                <div className="admin-card admin-content-card">
                  <div className="section-title">
                    <div>
                      <h3>Reset</h3>
                    </div>
                  </div>

                  <div className="tool-grid">
                    <button
                      className="btn danger"
                      onClick={async () => {
                        if (!window.confirm("Delete all application data? This cannot be undone.")) {
                          return;
                        }

                        await clearAllData();
                        await loadAll();
                        clearBill();
                        alert("All application data has been reset.");
                      }}
                    >
                      Reset All Data
                    </button>
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      <div className="app-credit">App Developed By - Hariharasudhan_22</div>
    </div>
  );
}