const router = require("express").Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");


const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getProducts);
router.get("/:id", getProductById);

// admin
router.post("/", adminOnly, createProduct);
router.put("/:id", adminOnly, updateProduct);
router.delete("/:id", adminOnly, deleteProduct);

module.exports = router;
