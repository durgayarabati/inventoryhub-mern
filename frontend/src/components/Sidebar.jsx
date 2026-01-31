import { NavLink } from "react-router-dom";

const Sidebar = () => (
  <div className="w-64 h-screen bg-gray-900 text-white fixed">
    <h1 className="text-xl font-bold p-4 border-b border-gray-700">StockFlow</h1>
    <nav className="flex flex-col p-3 space-y-2">
      <NavLink to="/" className="p-2 rounded hover:bg-gray-700">Dashboard</NavLink>
      <NavLink to="/products" className="p-2 rounded hover:bg-gray-700">Products</NavLink>
      <NavLink to="/add-product" className="p-2 rounded hover:bg-gray-700">Add Product</NavLink>
    </nav>
  </div>
);

export default Sidebar;