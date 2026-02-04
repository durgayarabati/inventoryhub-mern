import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  sku: "",
  category: "General",
  price: "",
  cost: "",
  unit: "pcs",
  status: "active",
  description: "",
  imageUrl: "",
};

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  // debounce search
  const debounceRef = useRef(null);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.sku.trim()) return false;

    // ✅ price must not be empty
    if (String(form.price).trim() === "") return false;

    const p = Number(form.price);
    if (!Number.isFinite(p) || p <= 0) return false; // use <=0 if you want minimum 1

    if (String(form.cost).trim() !== "") {
      const c = Number(form.cost);
      if (!Number.isFinite(c) || c < 0) return false;
    }

    return true;
  }, [form]);


  const load = async (isRefresh = false, query = q, status = statusFilter) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      // keep your server query param for search; filtering status client-side for now
      const res = await API.get(`/products?q=${encodeURIComponent(query)}`);
      const data = res.data.items || [];

      // status filter client side (so no backend change needed)
      const filtered =
        status === "all" ? data : data.filter((p) => String(p.status).toLowerCase() === status);

      setItems(filtered);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load products");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when q/status changes -> debounce load
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(true, q, statusFilter);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter]);

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p) => {
    setMode("edit");
    setSelected(p);
    setForm({
      name: p.name || "",
      sku: p.sku || "",
      category: p.category || "General",
      price: p.price ?? "",
      cost: p.cost ?? "",
      unit: p.unit || "pcs",
      status: p.status || "active",
      description: p.description || "",
      imageUrl: p.imageUrl || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        cost: form.cost === "" ? undefined : Number(form.cost),
        unit: form.unit.trim(),
        status: form.status,
        description: form.description,
        imageUrl: form.imageUrl,
      };

      if (mode === "create") {
        await API.post("/products", payload);
        toast.success("Product created ✅");
      } else {
        await API.put(`/products/${selected._id}`, payload);
        toast.success("Product updated ✅");
      }

      closeModal();
      await load(true);
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return;

    try {
      await API.delete(`/products/${p._id}`);
      toast.success("Product deleted ✅");
      await load(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const activeCount = useMemo(
    () => items.filter((p) => p.status === "active").length,
    [items]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Products</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage products (Admin can add/edit/delete)
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

          <select
            className="border rounded-xl px-3 py-2 bg-white w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>

          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60 w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {refreshing ? (
              <>
                <SpinnerWhite /> Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </button>

          {isAdmin && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-semibold w-full sm:w-auto"
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Total Products" value={items.length} />
        <Card title="Active" value={activeCount} />
        <Card title="Role" value={user?.role || "-"} />
      </div>

      {/* List/Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${items.length} products`}
          </p>
          <div className="text-xs text-gray-500">
            Your role: <span className="font-semibold">{user?.role}</span>
          </div>
        </div>

        {loading ? (
          <ProductsSkeleton />
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y">
              {items.map((p) => (
                <div key={p._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.sku} • {p.category}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill label={`₹${Number(p.price).toLocaleString("en-IN")}`} strong />
                        <StatusBadge status={p.status} />
                        {p.unit && <Pill label={p.unit} />}
                      </div>

                      {p.description && (
                        <p className="text-xs text-gray-600 mt-3 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(p)}
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="p-6 text-gray-500 text-center">No products found</div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-gray-600">
                    <th className="p-4">Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    {isAdmin && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {items.map((p) => (
                    <tr key={p._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4">{p.sku}</td>
                      <td className="p-4">{p.category}</td>
                      <td className="p-4 whitespace-nowrap">
                        ₹{Number(p.price).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {isAdmin && (
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className="px-3 py-2 rounded-xl border hover:bg-white text-sm font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => remove(p)}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td className="p-8 text-gray-500 text-center" colSpan={isAdmin ? 6 : 5}>
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Add Product" : "Edit Product"}
        onClose={closeModal}
      >
        {!isAdmin ? (
          <p className="text-sm text-gray-600">Only Admin can create or edit products.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {/* Image preview */}
            {form.imageUrl?.trim() ? (
              <div className="border rounded-2xl overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <Field label="Name *">
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Wireless Mouse"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="SKU *">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="e.g. MOUSE-001"
                />
              </Field>

              <Field label="Category">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="General"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Price *">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 499"
                />
              </Field>

              <Field label="Cost">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  inputMode="numeric"
                  placeholder="optional"
                />
              </Field>

              <Field label="Unit">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  placeholder="pcs"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Status">
                <select
                  className="w-full border rounded-xl px-3 py-2 bg-white"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </Field>

              <Field label="Image URL (optional)">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Short notes about product..."
              />
            </Field>

            {/* Sticky actions for mobile */}
            <div className="sticky bottom-0 bg-white pt-2">
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!canSubmit || saving}
                  className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : mode === "create" ? "Create" : "Update"}
                </button>
              </div>

              {!canSubmit && (
                <p className="text-xs text-gray-500 mt-2">
                  Please fill **Name, SKU, Price** correctly.
                </p>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------- UI helpers ---------- */

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
    s === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs border ${style}`}>
      {status || "—"}
    </span>
  );
}

function Pill({ label, strong }) {
  const base = "text-xs px-2.5 py-1 rounded-xl border inline-flex items-center";
  const style = strong
    ? "bg-gray-900 text-white border-gray-900"
    : "bg-white text-gray-700 border-gray-200";
  return <span className={`${base} ${style}`}>{label}</span>;
}

function ProductsSkeleton() {
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

function SpinnerWhite() {
  return (
    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
  );
}
