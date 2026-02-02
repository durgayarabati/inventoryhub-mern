import { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/dashboard");
      setStats(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-2">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quick overview of products, stock and orders.
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon="📦" />
        <StatCard title="Low Stock" value={stats?.lowStockCount ?? 0} icon="📉" />
        <StatCard title="Total Orders" value={stats?.totalOrders ?? 0} icon="🧾" />
        <StatCard
          title="Total Revenue"
          value={`₹${Number(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
          icon="💰"
        />
      </div>

      {/* Recent Orders */}
      <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold">Recent Orders</p>
            <p className="text-xs text-gray-500">Last 5 orders</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {(stats?.recentOrders || []).map((o) => (
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
                <td className="p-3">
                  <span className="px-2 py-1 rounded-lg text-xs border bg-white">
                    {o.status}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold">
                  ₹{Number(o.total).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}

            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <tr>
                <td className="p-6 text-gray-500 text-center" colSpan={4}>
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tip */}
      <div className="mt-4 p-4 bg-gray-50 border rounded-2xl">
        <p className="text-sm text-gray-700">
          Tip: Low Stock count is based on <b>quantity ≤ reorder level</b>.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
