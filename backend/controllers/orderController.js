const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

// Helper: ensure inventory exists
const ensureInventory = async (productId, session) => {
  let inv = await Inventory.findOne({ product: productId }).session(session);
  if (!inv) {
    const created = await Inventory.create([{ product: productId, quantity: 0, reorderLevel: 10 }], { session });
    inv = created[0];
  }
  return inv;
};

// POST /api/orders
// Admin + Staff (protected)
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, tax = 0, discount = 0, notes = "" } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    // 1) Fetch products & validate
    const orderItems = [];
    let subTotal = 0;

    for (const it of items) {
      const { productId, quantity } = it;

      const qty = Number(quantity);
      if (!productId || !qty || qty <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Each item needs productId and quantity > 0" });
      }

      const product = await Product.findOne({ _id: productId, isDeleted: false }).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      // 2) Stock check + reduce
      const inv = await ensureInventory(productId, session);
      if (inv.quantity < qty) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Not enough stock for ${product.name} (Available: ${inv.quantity}, Required: ${qty})`
        });
      }

      inv.quantity = inv.quantity - qty;
      inv.updatedBy = req.user?._id;
      await inv.save({ session });

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: qty
      });

      subTotal += product.price * qty;
    }

    const total = Math.max(subTotal + Number(tax) - Number(discount), 0);

    // 3) Create Order
    const created = await Order.create(
      [
        {
          items: orderItems,
          subTotal,
          tax,
          discount,
          total,
          notes,
          createdBy: req.user._id
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      message: "Order placed successfully",
      order: created[0]
    });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/orders
// Admin -> all orders, Staff -> own orders
const getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== "admin") {
      filter.createdBy = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ total: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/:id
// Admin -> any order, Staff -> only own
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("createdBy", "name email role");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role !== "admin" && String(order.createdBy._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status
// Admin only
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["placed", "processing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.json({ message: "Order status updated", order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
