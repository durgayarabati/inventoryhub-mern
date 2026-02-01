const Inventory = require("../models/Inventory");
const Product = require("../models/Product");

// Helper: create inventory record if missing
const ensureInventory = async (productId) => {
  let inv = await Inventory.findOne({ product: productId });
  if (!inv) inv = await Inventory.create({ product: productId, quantity: 0, reorderLevel: 10 });
  return inv;
};

// GET /api/inventory
// Admin + Staff (protected)
const getInventory = async (req, res) => {
  try {
    const { q, lowStock } = req.query;

    const filter = {};
    // lowStock=true => quantity <= reorderLevel
    if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };
    }

    let query = Inventory.find(filter)
      .populate({
        path: "product",
        match: { isDeleted: false },
        select: "name sku category status"
      })
      .sort({ updatedAt: -1 });

    const items = await query;

    // Remove null populated products (soft-deleted products)
    let cleaned = items.filter((x) => x.product);

    // Optional search by product fields
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      cleaned = cleaned.filter((x) => {
        const name = x.product?.name?.toLowerCase() || "";
        const sku = x.product?.sku?.toLowerCase() || "";
        const category = x.product?.category?.toLowerCase() || "";
        return name.includes(s) || sku.includes(s) || category.includes(s);
      });
    }

    return res.json({ total: cleaned.length, items: cleaned });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/inventory/:productId
// Admin + Staff (protected)
const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // validate product exists
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const inv = await ensureInventory(productId);
    const populated = await Inventory.findById(inv._id).populate("product", "name sku category status");

    return res.json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/inventory/:productId
// Admin only
// Update reorderLevel / location
const updateInventorySettings = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reorderLevel, location } = req.body;

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const inv = await ensureInventory(productId);

    if (reorderLevel !== undefined) inv.reorderLevel = reorderLevel;
    if (location !== undefined) inv.location = location;

    inv.updatedBy = req.user?._id;

    await inv.save();
    const populated = await Inventory.findById(inv._id).populate("product", "name sku category status");

    return res.json({ message: "Inventory settings updated", inventory: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// POST /api/inventory/:productId/adjust
// Admin only
// Stock IN / Stock OUT
const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type, amount } = req.body; // type: "in" | "out", amount: number

    if (!type || !["in", "out"].includes(type)) {
      return res.status(400).json({ message: "type must be 'in' or 'out'" });
    }
    const qty = Number(amount);
    if (!qty || qty <= 0) return res.status(400).json({ message: "amount must be > 0" });

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const inv = await ensureInventory(productId);

    if (type === "out" && inv.quantity < qty) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    inv.quantity = type === "in" ? inv.quantity + qty : inv.quantity - qty;
    inv.updatedBy = req.user?._id;
    await inv.save();

    const lowStock = inv.quantity <= inv.reorderLevel;

    const populated = await Inventory.findById(inv._id).populate("product", "name sku category status");

    return res.json({
      message: `Stock ${type === "in" ? "added" : "reduced"} successfully`,
      lowStock,
      inventory: populated
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getInventory,
  getInventoryByProduct,
  updateInventorySettings,
  adjustStock
};
