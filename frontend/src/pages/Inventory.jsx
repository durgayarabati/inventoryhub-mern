import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // inventory item
  const [tab, setTab] = useState("adjust"); // adjust | settings

  // Adjust form
  const [type, setType] = useState("in"); // in/out
  const [amount, setAmount] = useState("");

  // Settings form
  const [reorderLevel, setReorderLevel] = useState("");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.trim().toLowerCase();
    return items.filter((x) => {
      const name = x.product?.name?.toLowerCase() || "";
      const sku = x.product?.sku?.toLowerCase() || "";
      const cat = x.product?.category?.toLowerCase() || "";
      return name.includes(s) || sku.includes(s) || cat.includes(s);
    });
  }, [items, q]);

  const load = async () => {
    setLoading(true);
    try {
      const url = lowOnly ? "/inventory?lowStock=true" : "/inventory";
      const res = await API.get(url);
      setItems(res.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowOnly]);

  const openModal = (inv) => {
    setSelected(inv);
    setOpen(true);
    setTab("adjust");

    setType("in");
    setAmount("");

    setReorderLevel(inv.reorderLevel ?? "");
    setLocation(inv.location ?? "");
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
    setAmount("");
  };

  const lowStock = (inv) => (inv.quantity ?? 0) <= (inv.reorderLevel ?? 0);

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (!selected?.product?._id) return;

    const qty = Number(amount);
    if (!qty || qty <= 0) {
      toast.error("Amount must be > 0");
      return;
    }

    try {
      await API.post(`/inventory/${selected.product._id}/adjust`, {
        type,
        amount: qty
      });
      toast.success(`Stock ${type === "in" ? "added" : "reduced"} ✅`);
      closeModal();
      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Stock update failed");
    }
  };

  const submitSettings = async (e) => {
    e.preventDefault();
    if (!selected?.product?._id) return;

    const rl = Number(reorderLevel);
    if (!Number.isFinite(rl) || rl < 0) {
      toast.error("Reorder level must be 0 or more");
      return;
    }

    try {
      await API.put(`/inventory/${selected.product._id}`, {
        reorderLevel: rl,
        location
      });
      toast.success("Inventory settings updated ✅");
      closeModal();
      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">
            View stock, low-stock alerts, and adjust quantities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            className="border rounded-xl px-3 py-2 w-full sm:w-64"
            placeholder="Search name / sku / category..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button
            onClick={() => setLowOnly((v) => !v)}
            className={`px-4 py-2 rounded-xl border font-semibold ${
              lowOnly ? "bg-black text-white" : "bg-white hover:bg-gray-50"
            }`}
          >
            {lowOnly ? "Low Stock: ON" : "Low Stock: OFF"}
          </button>

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Total Items" value={items.length} />
        <Card
          title="Low Stock"
          value={items.filter(lowStock).length}
          hint="qty ≤ reorder level"
        />
        <Card title="Role" value={user?.role || "-"} />
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${filtered.length} records`}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Admin can adjust stock" : "View-only mode"}
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Reorder</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.map((inv) => {
              const isLow = lowStock(inv);
              return (
                <tr
                  key={inv._id}
                  className={`border-t hover:bg-gray-50 ${
                    isLow ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="p-3 font-medium">
                    {inv.product?.name || "—"}
                    {isLow && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-700 bg-white">
                        LOW
                      </span>
                    )}
                  </td>
                  <td className="p-3">{inv.product?.sku || "—"}</td>
                  <td className="p-3">{inv.product?.category || "—"}</td>
                  <td className="p-3 font-semibold">{inv.quantity}</td>
                  <td className="p-3">{inv.reorderLevel}</td>
                  <td className="p-3">{inv.location || "Main"}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-lg text-xs border bg-white">
                      {inv.product?.status || "—"}
                    </span>
                  </td>

                  {isAdmin && (
                    <td className="p-3">
                      <div className="flex justify-end">
                        <button
                          className="px-3 py-1 rounded-lg border hover:bg-white"
                          onClick={() => openModal(inv)}
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500 text-center" colSpan={isAdmin ? 8 : 7}>
                  No inventory records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Modal */}
      <Modal
        open={open}
        title={`Manage: ${selected?.product?.name || ""}`}
        onClose={closeModal}
      >
        {!isAdmin ? (
          <p className="text-sm text-gray-600">Only Admin can manage stock.</p>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTab("adjust")}
                className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition ${
                  tab === "adjust" ? "bg-white shadow" : "text-gray-600"
                }`}
              >
                Stock IN/OUT
              </button>
              <button
                type="button"
                onClick={() => setTab("settings")}
                className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition ${
                  tab === "settings" ? "bg-white shadow" : "text-gray-600"
                }`}
              >
                Settings
              </button>
            </div>

            {tab === "adjust" ? (
              <form className="mt-4 space-y-3" onSubmit={submitAdjust}>
                <Field label="Type">
                  <select
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="in">Stock IN (Add)</option>
                    <option value="out">Stock OUT (Reduce)</option>
                  </select>
                </Field>

                <Field label="Amount">
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-black text-white"
                  >
                    Apply
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  If stock is low, it will be highlighted in red.
                </p>
              </form>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={submitSettings}>
                <Field label="Reorder Level">
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    inputMode="numeric"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="e.g. 5"
                  />
                </Field>

                <Field label="Location">
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Main"
                  />
                </Field>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-black text-white">
                    Save
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

function Card({ title, value, hint }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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
