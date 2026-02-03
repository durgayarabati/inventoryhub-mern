import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const res = await API.get("/dashboard");
      setStats(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const cards = useMemo(() => {
    const revenue = `₹${Number(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`;
    return [
      { title: "Total Products", value: stats?.totalProducts ?? 0, icon: "📦" },
      { title: "Low Stock", value: stats?.lowStockCount ?? 0, icon: "📉" },
      { title: "Total Orders", value: stats?.totalOrders ?? 0, icon: "🧾" },
      { title: "Total Revenue", value: revenue, icon: "💰" },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quick overview of products, stock and orders.
          </p>
        </div>

        <button
          onClick={() => load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
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

      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon} />
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold">Recent Orders</p>
            <p className="text-xs text-gray-500">Last 5 orders</p>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden divide-y">
              {(stats?.recentOrders || []).map((o) => (
                <div key={o._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
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
                    </div>

                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}

              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <div className="p-6 text-gray-500 text-center">No orders yet</div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-gray-600">
                    <th className="p-4">Date</th>
                    <th className="p-4">Created By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {(stats?.recentOrders || []).map((o) => (
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
                      <td className="p-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="p-4 text-right font-semibold whitespace-nowrap">
                        ₹{Number(o.total).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}

                  {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                    <tr>
                      <td className="p-8 text-gray-500 text-center" colSpan={4}>
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

      {/* Tip */}
      <div className="p-4 sm:p-5 bg-gray-50 border rounded-2xl">
        <p className="text-sm text-gray-700">
          Tip: Low Stock count is based on <b>quantity ≤ reorder level</b>.
        </p>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-5 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold mt-2 text-gray-900">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-2/3 bg-gray-900/20" />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  const style =
    s === "paid" || s === "completed"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "pending"
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

/* ---------- Skeletons ---------- */

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded mt-4 animate-pulse" />
          <div className="h-2 w-full bg-gray-100 rounded mt-4 overflow-hidden">
            <div className="h-full w-2/3 bg-gray-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-28 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
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
