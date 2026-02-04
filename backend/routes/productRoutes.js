const router = require("express").Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/auth");      // your JWT middleware
const { adminOnly } = require("../middleware/adminOnly"); // your role middleware

router.use(protect);

router.get("/", getProducts);
router.get("/:id", getProductById);

// admin
router.post("/", adminOnly, createProduct);
router.put("/:id", adminOnly, updateProduct);
router.delete("/:id", adminOnly, deleteProduct);

module.exports = router;
