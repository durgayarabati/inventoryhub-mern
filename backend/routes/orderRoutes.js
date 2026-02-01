const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} = require("../controllers/orderController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getOrders);
router.get("/:id", protect, getOrderById);

// Admin only
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
