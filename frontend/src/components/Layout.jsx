import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-black text-white shadow"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const NavItems = ({ onClick }) => (
    <nav className="mt-4 space-y-1">
      <NavLink to="/" className={linkClass} end onClick={onClick}>
        Dashboard
      </NavLink>
      <NavLink to="/products" className={linkClass} onClick={onClick}>
        Products
      </NavLink>
      <NavLink to="/inventory" className={linkClass} onClick={onClick}>
        Inventory
      </NavLink>
      <NavLink to="/orders" className={linkClass} onClick={onClick}>
        Orders
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Topbar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b md:hidden">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            {/* hamburger */}
            <span className="block w-6 h-0.5 bg-gray-900 mb-1" />
            <span className="block w-6 h-0.5 bg-gray-900 mb-1" />
            <span className="block w-6 h-0.5 bg-gray-900" />
          </button>

          <div className="text-center">
            <p className="font-bold leading-tight">InventoryHub</p>
            <p className="text-xs text-gray-500">Role: {user?.role || "-"}</p>
          </div>

          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-black text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:sticky md:top-0 md:h-screen bg-white border-r">
          <div className="p-5 border-b">
            <h1 className="text-xl font-extrabold tracking-tight">
              InventoryHub
            </h1>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {user?.name || "User"}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {user?.role || "role"}
              </span>
            </div>
          </div>

          <div className="p-4">
            <NavItems />
          </div>

          <div className="mt-auto p-4 border-t">
            <button
              onClick={logout}
              className="w-full px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            {/* panel */}
            <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">InventoryHub</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.name || "User"} • {user?.role || "role"}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <NavItems onClick={() => setOpen(false)} />

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-black text-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-white border-b p-5 items-center justify-between sticky top-0 z-30">
            <div>
              <p className="text-xs text-gray-500">Welcome back</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {user?.role || "role"}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
