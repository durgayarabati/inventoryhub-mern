const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true }, // unique product code
    category: { type: String, default: "General", trim: true },

    price: { type: Number, required: true, min: 0 }, // selling price
    cost: { type: Number, default: 0, min: 0 }, // optional: buying cost

    unit: { type: String, default: "pcs", trim: true }, // pcs, kg, etc.
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Soft delete (delete chesthe DB lo record delete kakunda hide chestham)
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Helpful indexes for fast searching
productSchema.index({ name: "text", sku: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
