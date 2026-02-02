# InventoryHub 🏬  
**Smart Inventory. Smart Business.**

InventoryHub is a full-stack **Inventory & Order Management System** built using the **MERN stack**.  
It supports **role-based access (Admin / Staff)**, product management, inventory tracking, order processing, and a real-time dashboard.

This project is designed following **industry best practices** and is suitable for **entry-level / junior MERN developer roles**.

---

## 🚀 Features

### 🔐 Authentication & Roles
- Secure Login & Register using **JWT**
- **Seeded Admin (Option B – industry approach)**
- Role-based access control:
  - **Admin** – full access
  - **Staff** – limited access (view & create orders)

---

### 📦 Product Management
- Add / Edit / Delete products (**Admin only**)
- View products (**Staff**)
- SKU uniqueness
- Soft delete (industry practice)
- Search by name, SKU, or category

---

### 🧮 Inventory Management
- Real-time inventory tracking
- Stock **IN / OUT** operations
- Reorder level configuration
- Low-stock alerts (highlighted)
- Role-based permissions

---

### 🧾 Order Management
- Create orders with multiple products
- Automatic stock reduction on order placement
- Order status tracking:
  - Placed
  - Processing
  - Completed
  - Cancelled
- Admin can update order status
- Staff can view only their own orders

---

### 📊 Dashboard
- Total products
- Low stock count
- Total orders
- Total revenue
- Recent orders overview

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Context API
- Axios
- react-hot-toast

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt (password hashing)

---

## 🧱 Project Architecture


- Follows **MVC pattern**
- Clean separation of concerns
- Scalable & maintainable structure

---

## 🔑 Role Permissions

| Feature | Admin | Staff |
|------|------|------|
| Login | ✅ | ✅ |
| Register | ❌ (seeded) | ✅ |
| Products CRUD | ✅ | ❌ |
| View Products | ✅ | ✅ |
| Inventory Adjust | ✅ | ❌ |
| View Inventory | ✅ | ✅ |
| Create Orders | ✅ | ✅ |
| Update Order Status | ✅ | ❌ |
| Dashboard Access | ✅ | ✅ |

📌 Future Enhancements

User management UI (Admin → Create Staff)

Reports & analytics

Export inventory/orders to Excel

Deployment (Vercel + Render)

Email notifications for low stock


⭐ Final Note

This project demonstrates real-world MERN stack development, including:

Authentication

Authorization

Business logic

Clean UI

Scalable backend design

Feel free to ⭐ star the repo if you find it useful!
Thank you!