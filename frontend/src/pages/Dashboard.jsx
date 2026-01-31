const Dashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-white p-4 rounded-xl shadow">Total Products</div>
    <div className="bg-white p-4 rounded-xl shadow">Low Stock</div>
    <div className="bg-white p-4 rounded-xl shadow">Out of Stock</div>
  </div>
);

export default Dashboard;