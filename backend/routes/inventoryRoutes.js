const router = require("express").Router();
const {
  getInventory,
  getInventoryByProduct,
  updateInventorySettings,
  adjustStock,
  backfillInventory,
} = require("../controllers/inventory.controller");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");

router.use(protect);

// ✅ backfill MUST come before /:productId
router.post("/backfill", adminOnly, backfillInventory);

router.get("/", getInventory);
router.get("/:productId", getInventoryByProduct);

// admin
router.put("/:productId", adminOnly, updateInventorySettings);
router.post("/:productId/adjust", adminOnly, adjustStock);

module.exports = router;
