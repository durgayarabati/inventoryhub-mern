const express = require("express");
const {
  getInventory,
  getInventoryByProduct,
  updateInventorySettings,
  adjustStock
} = require("../controllers/inventoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin + Staff can view
router.get("/", protect, getInventory);
router.get("/:productId", protect, getInventoryByProduct);

// Admin can update settings and adjust stock
router.put("/:productId", protect, adminOnly, updateInventorySettings);
router.post("/:productId/adjust", protect, adminOnly, adjustStock);

module.exports = router;
