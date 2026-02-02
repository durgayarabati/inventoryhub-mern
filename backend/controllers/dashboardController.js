const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Order = require("../models/Order");

const getDashboardStats = async (req, res) => {
  try {
    // products (exclude soft-deleted)
    const totalProducts = await Product.countDocuments({ isDeleted: false });

    // inventory low-stock count (qty <= reorderLevel)
    const lowStockCount = await Inventory.countDocuments({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    });

    // orders
    const totalOrders = await Order.countDocuments();

    // revenue (sum of totals) - simple metric
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, revenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueAgg?.[0]?.revenue || 0;

    // recent orders (latest 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("total status createdAt")
      .populate("createdBy", "name role");

    return res.json({
      totalProducts,
      lowStockCount,
      totalOrders,
      totalRevenue,
      recentOrders
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardStats };
