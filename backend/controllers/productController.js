const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// Helper: create inventory record if missing
const ensureInventory = async (productId) => {
  let inv = await Inventory.findOne({ product: productId });
  if (!inv) {
    inv = await Inventory.create({
      product: productId,
      quantity: 0,
      reorderLevel: 10,
      location: "Main",
    });
  }
  return inv;
};

// POST /api/products
// Admin only
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      cost,
      unit,
      description,
      imageUrl,
      status,
    } = req.body;

    if (!name || !sku || price === undefined) {
      return res.status(400).json({ message: "name, sku, price are required" });
    }

    const normalizedSku = sku.trim().toUpperCase();

    const exists = await Product.findOne({ sku: normalizedSku, isDeleted: false });
    if (exists) return res.status(409).json({ message: "SKU already exists" });

    const product = await Product.create({
      name: name.trim(),
      sku: normalizedSku,
      category,
      price,
      cost,
      unit,
      description,
      imageUrl,
      status,
      createdBy: req.user?._id,
    });

    // ✅ KEY FIX: create inventory row immediately
    await ensureInventory(product._id);

    return res.status(201).json({ message: "Product created", product });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/products?q=&page=&limit=&status=&category=
const getProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, status, category } = req.query;

    const filters = { isDeleted: false };
    if (status) filters.status = status;
    if (category) filters.category = category;

    // Text search (name/sku/category)
    if (q && q.trim()) {
      filters.$text = { $search: q.trim() };
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(filters),
    ]);

    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      items,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id
// Admin only
const updateProduct = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.sku) updates.sku = updates.sku.trim().toUpperCase();

    // If sku changed, check duplicate
    if (updates.sku) {
      const dup = await Product.findOne({
        sku: updates.sku,
        _id: { $ne: req.params.id },
        isDeleted: false,
      });
      if (dup) return res.status(409).json({ message: "SKU already exists" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Optional safety (useful for old data)
    await ensureInventory(product._id);

    return res.json({ message: "Product updated", product });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id
// Admin only (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Inventory records can remain; inventory list hides soft-deleted products via populate match
    return res.json({ message: "Product deleted (soft)", productId: product._id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
