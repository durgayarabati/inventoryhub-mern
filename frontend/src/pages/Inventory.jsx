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
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("adjust"); // adjust | settings

  // Adjust form
  const [type, setType] = useState("in");
  const [amount, setAmount] = useState("");

  // Settings form
  const [reorderLevel, setReorderLevel] = useState("");
  const [location, setLocation] = useState("");

  const lowStock = (inv) => (inv.quantity ?? 0) <= (inv.reorderLevel ?? 0);

  const filtered = useMemo(() => {
    const list = lowOnly ? items.filter(lowStock) : items;
    if (!q.trim()) return list;

    const s = q.trim().toLowerCase();
    return list.filter((x) => {
      const name = x.product?.name?.toLowerCase() || "";
      const sku = x.product?.sku?.toLowerCase() || "";
      const cat = x.product?.category?.toLowerCase() || "";
      return name.includes(s) || sku.includes(s) || cat.includes(s);
    });
  }, [items, q, lowOnly]);

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await API.get("/inventory");
      setItems(res.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load inventory");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (!selected?.product?._id) return;

    const qty = Number(amount);
    if (!qty || qty <= 0) return toast.error("Amount must be > 0");

    try {
      await API.post(`/inventory/${selected.product._id}/adjust`, {
        type,
        amount: qty,
      });
      toast.success(`Stock ${type === "in" ? "added" : "reduced"} ✅`);
      closeModal();
      await load(true);
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
        location,
      });
      toast.success("Inventory settings updated ✅");
      closeModal();
      await load(true);
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Update failed");
    }
  };

  const lowCount = useMemo(() => items.filter(lowStock).length, [items]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">
            View stock, low-stock alerts, and adjust quantities.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              className="w-full border rounded-xl pl-10 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Search name / sku / category..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>

          <button
            onClick={() => setLowOnly((v) => !v)}
            className={`px-4 py-2 rounded-xl border font-semibold transition w-full sm:w-auto ${
              lowOnly
                ? "bg-black text-white border-black"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {lowOnly ? "Low Stock: ON" : "Low Stock: OFF"}
          </button>

          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60 w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {refreshing ? (
              <>
                <Spinner /> Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard title="Total Items" value={items.length} />
        <SummaryCard title="Low Stock" value={lowCount} hint="qty ≤ reorder level" />
        <SummaryCard title="Role" value={user?.role || "-"} />
      </div>

      {/* List/Table Wrapper */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${filtered.length} records`}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? "Admin can adjust stock" : "View-only mode"}
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <InventorySkeleton />
        ) : (
          <>
            {/* Mobile view: cards */}
            <div className="md:hidden divide-y">
              {filtered.map((inv) => {
                const isLow = lowStock(inv);
                return (
                  <div key={inv._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {inv.product?.name || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {inv.product?.sku || "—"} • {inv.product?.category || "—"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill label={`Qty: ${inv.quantity ?? 0}`} strong />
                          <Pill label={`Reorder: ${inv.reorderLevel ?? 0}`} />
                          <Pill label={`Loc: ${inv.location || "Main"}`} />
                          <Pill label={inv.product?.status || "—"} />
                          {isLow && <Pill label="LOW" danger />}
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => openModal(inv)}
                          className="shrink-0 px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm font-semibold"
                        >
                          Manage
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="p-6 text-gray-500 text-center">
                  No inventory records
                </div>
              )}
            </div>

            {/* Desktop view: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-gray-600">
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Reorder</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    {isAdmin && <th className="p-4 text-right">Actions</th>}
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
                        <td className="p-4 font-medium">
                          {inv.product?.name || "—"}
                          {isLow && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-lg border border-red-200 text-red-700 bg-white">
                              LOW
                            </span>
                          )}
                        </td>
                        <td className="p-4">{inv.product?.sku || "—"}</td>
                        <td className="p-4">{inv.product?.category || "—"}</td>
                        <td className="p-4 font-semibold">{inv.quantity ?? 0}</td>
                        <td className="p-4">{inv.reorderLevel ?? 0}</td>
                        <td className="p-4">{inv.location || "Main"}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-lg text-xs border bg-white">
                            {inv.product?.status || "—"}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="p-4">
                            <div className="flex justify-end">
                              <button
                                className="px-3 py-2 rounded-xl border hover:bg-white text-sm font-semibold"
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

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        className="p-8 text-gray-500 text-center"
                        colSpan={isAdmin ? 8 : 7}
                      >
                        No inventory records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
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

                {/* Sticky actions for mobile */}
                <div className="sticky bottom-0 bg-white pt-3 pb-1">
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-black text-white">
                      Apply
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Low stock rows are highlighted in red.
                  </p>
                </div>
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

                <div className="sticky bottom-0 bg-white pt-3 pb-1">
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
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
                </div>
              </form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

/* ---------- UI bits ---------- */

function SummaryCard({ title, value, hint }) {
  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-extrabold mt-1 text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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

function Pill({ label, strong, danger }) {
  const base = "text-xs px-2.5 py-1 rounded-xl border inline-flex items-center";
  const style = danger
    ? "bg-red-50 text-red-700 border-red-200"
    : strong
    ? "bg-gray-900 text-white border-gray-900"
    : "bg-white text-gray-700 border-gray-200";
  return <span className={`${base} ${style}`}>{label}</span>;
}

function InventorySkeleton() {
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

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
  );
}
