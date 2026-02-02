import { useEffect, useMemo, useState } from "react";
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
  imageUrl: ""
};

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!form.sku.trim()) return false;
    const p = Number(form.price);
    if (!Number.isFinite(p) || p < 0) return false;
    return true;
  }, [form]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/products?q=${encodeURIComponent(q)}`);
      setItems(res.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      imageUrl: p.imageUrl || ""
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
        imageUrl: form.imageUrl
      };

      if (mode === "create") {
        await API.post("/products", payload);
        toast.success("Product created ✅");
      } else {
        await API.put(`/products/${selected._id}`, payload);
        toast.success("Product updated ✅");
      }

      closeModal();
      await load();
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
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Products</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage products (Admin can add/edit/delete)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
            <input
              className="border rounded-xl px-3 py-2 w-full sm:w-64"
              placeholder="Search name / sku / category..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl bg-black text-white"
            >
              Search
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 font-semibold"
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${items.length} products`}
          </p>
          <div className="text-xs text-gray-500">
            Your role: <span className="font-semibold">{user?.role}</span>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">₹{p.price}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs border ${
                      p.status === "active"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>

                {isAdmin && (
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1 rounded-lg border hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="px-3 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td
                  className="p-6 text-gray-500 text-center"
                  colSpan={isAdmin ? 6 : 5}
                >
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Add Product" : "Edit Product"}
        onClose={closeModal}
      >
        {!isAdmin ? (
          <p className="text-sm text-gray-600">
            Only Admin can create or edit products.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Name *">
              <input
                className="w-full border rounded-xl px-3 py-2"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="SKU *">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
              </Field>

              <Field label="Category">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
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
                />
              </Field>

              <Field label="Cost">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  inputMode="numeric"
                />
              </Field>

              <Field label="Unit">
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
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
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
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
                disabled={!canSubmit || saving}
                className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : mode === "create" ? "Create" : "Update"}
              </button>
            </div>

            {!canSubmit && (
              <p className="text-xs text-gray-500">
                Please fill **Name, SKU, Price** correctly.
              </p>
            )}
          </form>
        )}
      </Modal>
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
