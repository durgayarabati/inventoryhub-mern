import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // products for create order
  const [prodLoading, setProdLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // create modal
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [cart, setCart] = useState([]); // [{productId,name,price,quantity,sku}]
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  // status update (admin)
  const [statusSavingId, setStatusSavingId] = useState(null);

  const loadOrders = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await API.get("/orders");
      setOrders(res.data.orders || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load orders");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  const loadProducts = async () => {
    setProdLoading(true);
    try {
      const res = await API.get("/products?limit=100");
      setProducts(res.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load products");
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(false);
  }, []);

  const openCreate = async () => {
    setOpen(true);
    setCart([]);
    setTax("0");
    setDiscount("0");
    setNotes("");
    setSelectedProductId("");
    setQty("1");
    await loadProducts();
  };

  const closeCreate = () => {
    setOpen(false);
    setCart([]);
  };

  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const addToCart = () => {
    const quantity = Number(qty);
    if (!selectedProduct) return toast.error("Select a product");
    if (!quantity || quantity <= 0) return toast.error("Quantity must be > 0");

    setCart((prev) => {
      const idx = prev.findIndex((x) => x.productId === selectedProduct._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          quantity,
        },
      ];
    });

    setSelectedProductId("");
    setQty("1");
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  };

  const subTotal = useMemo(() => {
    return cart.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity),
      0
    );
  }, [cart]);

  const total = useMemo(() => {
    const t = Number(tax) || 0;
    const d = Number(discount) || 0;
    return Math.max(subTotal + t - d, 0);
  }, [subTotal, tax, discount]);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Add at least 1 product");

    setPlacing(true);
    try {
      const payload = {
        items: cart.map((x) => ({ productId: x.productId, quantity: x.quantity })),
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        notes,
      };

      await API.post("/orders", payload);
      toast.success("Order placed ✅");
      closeCreate();
      await loadOrders(true);
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Order failed");
    } finally {
      setPlacing(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    setStatusSavingId(orderId);
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      toast.success("Status updated ✅");
      await loadOrders(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed");
    } finally {
      setStatusSavingId(null);
    }
  };

  // filters applied
  const filteredOrders = useMemo(() => {
    let list = orders;

    if (statusFilter !== "all") {
      list = list.filter((o) => String(o.status).toLowerCase() === statusFilter);
    }

    const s = q.trim().toLowerCase();
    if (!s) return list;

    return list.filter((o) => {
      const name = o.createdBy?.name?.toLowerCase() || "";
      const role = o.createdBy?.role?.toLowerCase() || "";
      const status = String(o.status || "").toLowerCase();
      return name.includes(s) || role.includes(s) || status.includes(s);
    });
  }, [orders, q, statusFilter]);

  const completedCount = useMemo(
    () => orders.filter((o) => o.status === "completed").length,
    [orders]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create orders and track status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              className="w-full border rounded-xl pl-10 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Search created by / status..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>

          <select
            className="border rounded-xl px-3 py-2 bg-white w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="placed">placed</option>
            <option value="processing">processing</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>

          <button
            onClick={() => loadOrders(true)}
            disabled={loading || refreshing}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-semibold disabled:opacity-60 w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {refreshing ? (
              <>
                <SpinnerBlack /> Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </button>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-black text-white font-semibold w-full sm:w-auto"
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Total Orders" value={orders.length} />
        <Card title="Completed" value={completedCount} />
        <Card title="Role" value={user?.role || "-"} />
      </div>

      {/* Orders */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${filteredOrders.length} orders`}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Admin sees all orders" : "You see your orders only"}
          </p>
        </div>

        {loading ? (
          <OrdersSkeleton />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filteredOrders.map((o) => (
                <div key={o._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{Number(o.total).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        {o.createdBy?.name || "—"}{" "}
                        <span className="text-gray-400">
                          ({o.createdBy?.role || "—"})
                        </span>
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill label={`Items: ${o.items?.length || 0}`} />
                        <StatusBadge status={o.status} />
                      </div>
                    </div>

                    {isAdmin && (
                      <select
                        className="border rounded-xl px-3 py-2 bg-white text-sm"
                        value={o.status}
                        disabled={statusSavingId === o._id}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                      >
                        <option value="placed">placed</option>
                        <option value="processing">processing</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="p-6 text-gray-500 text-center">No orders yet</div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-gray-600">
                    <th className="p-4">Date</th>
                    <th className="p-4">Created By</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Total</th>
                    {isAdmin && <th className="p-4 text-right">Update</th>}
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {o.createdBy?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {o.createdBy?.role || "—"}
                        </div>
                      </td>

                      <td className="p-4">{o.items?.length || 0}</td>

                      <td className="p-4">
                        <StatusBadge status={o.status} />
                      </td>

                      <td className="p-4 text-right font-semibold whitespace-nowrap">
                        ₹{Number(o.total).toLocaleString("en-IN")}
                      </td>

                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex justify-end">
                            <select
                              className="border rounded-xl px-3 py-2 bg-white text-sm"
                              value={o.status}
                              disabled={statusSavingId === o._id}
                              onChange={(e) => updateStatus(o._id, e.target.value)}
                            >
                              <option value="placed">placed</option>
                              <option value="processing">processing</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td className="p-8 text-gray-500 text-center" colSpan={isAdmin ? 6 : 5}>
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create order modal */}
      <Modal open={open} title="Create Order" onClose={closeCreate}>
        <form onSubmit={placeOrder} className="space-y-4">
          <div className="bg-gray-50 border rounded-2xl p-3">
            <p className="font-semibold">Add products</p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                className="border rounded-xl px-3 py-2 bg-white sm:col-span-2"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={prodLoading}
              >
                <option value="">
                  {prodLoading ? "Loading products..." : "Select product"}
                </option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{p.price}) - {p.sku}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  className="border rounded-xl px-3 py-2 w-full"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                  placeholder="Qty"
                />
                <button
                  type="button"
                  onClick={addToCart}
                  className="px-4 py-2 rounded-xl bg-black text-white"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Cart list */}
            <div className="mt-3 space-y-2">
              {cart.map((it) => (
                <div
                  key={it.productId}
                  className="flex items-center justify-between bg-white border rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{it.name}</p>
                    <p className="text-xs text-gray-500">
                      {it.sku} • ₹{it.price} × {it.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold whitespace-nowrap">
                      ₹{Number(it.price * it.quantity).toLocaleString("en-IN")}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(it.productId)}
                      className="px-3 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <p className="text-sm text-gray-600">No items added yet.</p>
              )}
            </div>
          </div>

          {/* totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field label="Tax">
              <input
                className="border rounded-xl px-3 py-2 w-full"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Discount">
              <input
                className="border rounded-xl px-3 py-2 w-full"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Subtotal">
              <div className="border rounded-xl px-3 py-2 bg-gray-50">
                ₹{Number(subTotal).toLocaleString("en-IN")}
              </div>
            </Field>
          </div>

          <Field label="Notes (optional)">
            <input
              className="border rounded-xl px-3 py-2 w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. urgent delivery"
            />
          </Field>

          {/* Sticky Total + Actions (mobile friendly) */}
          <div className="sticky bottom-0 bg-white pt-3">
            <div className="flex items-center justify-between bg-black text-white rounded-2xl p-3">
              <p className="font-semibold">Total</p>
              <p className="text-xl font-bold">
                ₹{Number(total).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={closeCreate}
                className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={placing}
                className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
              >
                {placing ? "Placing..." : "Place Order"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Note: Order placement reduces inventory automatically.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Small UI components ---------- */

function Card({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-extrabold mt-1 text-gray-900">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-2/3 bg-gray-900/20" />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const style =
    s === "completed"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "processing"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : s === "placed"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : s === "cancelled" || s === "canceled"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs border ${style}`}>
      {status || "—"}
    </span>
  );
}

function Pill({ label }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-xl border bg-white text-gray-700 border-gray-200">
      {label}
    </span>
  );
}

function OrdersSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SpinnerBlack() {
  return (
    <span className="inline-block h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
  );
}
