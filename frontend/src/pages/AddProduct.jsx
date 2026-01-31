const AddProduct = () => (
  <div className="max-w-xl bg-white p-4 rounded-xl shadow">
    <h2 className="text-xl font-semibold mb-4">Add Product</h2>
    <input className="w-full p-2 border rounded mb-2" placeholder="Name" />
    <input className="w-full p-2 border rounded mb-2" placeholder="Category" />
    <input className="w-full p-2 border rounded mb-2" placeholder="Stock" />
    <button className="w-full bg-green-600 text-white p-2 rounded">Add</button>
  </div>
);

export default AddProduct;