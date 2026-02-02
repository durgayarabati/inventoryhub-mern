require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  try {
    await connectDB();

    const name = process.env.SEED_ADMIN_NAME || "Super Admin";
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("❌ Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in .env");
      process.exit(1);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      console.log("✅ Admin already exists:", exists.email, "| role:", exists.role);
      process.exit(0);
    }

    const admin = await User.create({ name, email, password, role: "admin" });
    console.log("✅ Seed admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

run();
