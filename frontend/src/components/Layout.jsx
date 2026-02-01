import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg ${
      isActive ? "bg-black text-white" : "hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4">
        <h1 className="text-xl font-bold">InventoryHub</h1>
        <p className="text-sm text-gray-500 mt-1">Role: {user?.role}</p>

        <nav className="mt-6 space-y-2">
          <NavLink to="/" className={linkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="bg-white border-b p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Welcome</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            Logout
          </button>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
