import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

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

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders");
      setOrders(res.data.orders || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setProdLoading(true);
    try {
      // use high limit so dropdown has items
      const res = await API.get("/products?limit=100");
      setProducts(res.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load products");
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
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
    if (!selectedProduct) {
      toast.error("Select a product");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error("Quantity must be > 0");
      return;
    }

    // merge if same product already in cart
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.productId === selectedProduct._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + quantity
        };
        return copy;
      }
      return [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          quantity
        }
      ];
    });

    setSelectedProductId("");
    setQty("1");
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  };

  const subTotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
  }, [cart]);

  const total = useMemo(() => {
    const t = Number(tax) || 0;
    const d = Number(discount) || 0;
    return Math.max(subTotal + t - d, 0);
  }, [subTotal, tax, discount]);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Add at least 1 product");
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        items: cart.map((x) => ({ productId: x.productId, quantity: x.quantity })),
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        notes
      };

      await API.post("/orders", payload);
      toast.success("Order placed ✅");
      closeCreate();
      await loadOrders();
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
      await loadOrders();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed");
    } finally {
      setStatusSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create orders and track status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadOrders}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-semibold"
          >
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-black text-white font-semibold"
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Total Orders" value={orders.length} />
        <Card
          title="Completed"
          value={orders.filter((o) => o.status === "completed").length}
        />
        <Card title="Role" value={user?.role || "-"} />
      </div>

      {/* Orders table */}
      <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${orders.length} orders`}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Admin sees all orders" : "You see your orders only"}
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Items</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
              {isAdmin && <th className="p-3 text-right">Update</th>}
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  {new Date(o.createdAt).toLocaleString()}
                </td>

                <td className="p-3">
                  {o.createdBy?.name || "—"}{" "}
                  <span className="text-xs text-gray-500">
                    ({o.createdBy?.role || "—"})
                  </span>
                </td>

                <td className="p-3">{o.items?.length || 0}</td>

                <td className="p-3">
                  <span className="px-2 py-1 rounded-lg text-xs border bg-white">
                    {o.status}
                  </span>
                </td>

                <td className="p-3 text-right font-semibold">
                  ₹{Number(o.total).toLocaleString("en-IN")}
                </td>

                {isAdmin && (
                  <td className="p-3">
                    <div className="flex justify-end">
                      <select
                        className="border rounded-lg px-2 py-1 bg-white"
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

            {!loading && orders.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500 text-center" colSpan={isAdmin ? 6 : 5}>
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                  <div>
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-xs text-gray-500">
                      {it.sku} • ₹{it.price} × {it.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">
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

          <div className="flex items-center justify-between bg-black text-white rounded-2xl p-3">
            <p className="font-semibold">Total</p>
            <p className="text-xl font-bold">
              ₹{Number(total).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
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

          <p className="text-xs text-gray-500">
            Note: Order placement reduces inventory automatically.
          </p>
        </form>
      </Modal>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
