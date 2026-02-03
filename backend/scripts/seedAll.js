require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Order = require("../models/Order");

const run = async () => {
  try {
    await connectDB();
    console.log("🌱 Seeding demo data...");

    // ⚠️ CLEAR EXISTING DATA (demo/local only)
    await Order.deleteMany({});
    await Inventory.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // =========================
    // 👤 USERS
    // =========================
    const admin = await User.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "123456",
      role: "admin"
    });

    const staff1 = await User.create({
      name: "Ravi",
      email: "staff1@gmail.com",
      password: "123456",
      role: "staff"
    });

    const staff2 = await User.create({
      name: "Suresh",
      email: "staff2@gmail.com",
      password: "123456",
      role: "staff"
    });

    // =========================
    // 📦 PRODUCTS
    // =========================
    const products = await Product.insertMany([
      {
        name: "A4 Paper Bundle",
        sku: "PAPER-A4",
        category: "Stationery",
        price: 280,
        cost: 200,
        unit: "pack",
        status: "active",
        isDeleted: false
      },
      {
        name: "Notebook 200 Pages",
        sku: "NOTE-200",
        category: "Stationery",
        price: 60,
        cost: 40,
        unit: "pcs",
        status: "active",
        isDeleted: false
      },
      {
        name: "Blue Ball Pen",
        sku: "PEN-BLUE",
        category: "Stationery",
        price: 10,
        cost: 6,
        unit: "pcs",
        status: "active",
        isDeleted: false
      },
      {
        name: "Printer Ink Black",
        sku: "INK-BLK",
        category: "Electronics",
        price: 850,
        cost: 650,
        unit: "pcs",
        status: "active",
        isDeleted: false
      },
      {
        name: "Stapler Machine",
        sku: "STAPLER",
        category: "Office",
        price: 120,
        cost: 90,
        unit: "pcs",
        status: "active",
        isDeleted: false
      },
      {
        name: "Marker Pen",
        sku: "MARKER",
        category: "Office",
        price: 35,
        cost: 25,
        unit: "pcs",
        status: "active",
        isDeleted: false
      }
    ]);

    // =========================
    // 🧮 INVENTORY
    // =========================
    await Inventory.insertMany(
      products.map((p) => ({
        product: p._id,
        quantity: p.sku.includes("INK") ? 5 : 50,
        reorderLevel: p.sku.includes("INK") ? 3 : 10,
        location: "Main Store"
      }))
    );

    // =========================
    // 🧾 ORDERS (MATCHES YOUR Order.js)
    // =========================
    const buildOrder = ({ items, tax = 0, discount = 0, status = "placed", notes = "", createdBy }) => {
      const subTotal = items.reduce(
        (sum, it) => sum + it.price * it.quantity,
        0
      );
      const total = Math.max(subTotal + tax - discount, 0);

      return {
        items,
        subTotal,
        tax,
        discount,
        total,
        status,
        notes,
        createdBy
      };
    };

    const order1Items = [
      {
        product: products[0]._id,
        name: products[0].name,
        sku: products[0].sku,
        price: products[0].price,
        quantity: 2
      },
      {
        product: products[2]._id,
        name: products[2].name,
        sku: products[2].sku,
        price: products[2].price,
        quantity: 10
      }
    ];

    const order2Items = [
      {
        product: products[3]._id,
        name: products[3].name,
        sku: products[3].sku,
        price: products[3].price,
        quantity: 1
      },
      {
        product: products[1]._id,
        name: products[1].name,
        sku: products[1].sku,
        price: products[1].price,
        quantity: 5
      }
    ];

    await Order.create([
      buildOrder({
        items: order1Items,
        status: "completed",
        notes: "Demo order - completed",
        createdBy: staff1._id
      }),
      buildOrder({
        items: order2Items,
        discount: 50,
        status: "processing",
        notes: "Demo order - processing",
        createdBy: staff2._id
      })
    ]);

    console.log("✅ Seed completed successfully!");
    console.log("🔐 Admin  : admin@mail.com / 123456");
    console.log("👤 Staff1 : staff1@mail.com / 123456");
    console.log("👤 Staff2 : staff2@mail.com / 123456");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

run();
