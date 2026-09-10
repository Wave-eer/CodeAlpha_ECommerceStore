# CodeAlpha_ECommerceStore (HaloMarket)

A production-ready e-commerce web application built for the **CodeAlpha Full Stack Development Internship — Task 1**.

---

## Task 1 Requirements Checklist

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Product Listings** | Responsive catalog with search, category filtering, ratings, badges, and sorting | ✅ Complete |
| **Product Details Page** | Detailed product views with image gallery, specs, stock indicator, and related items | ✅ Complete |
| **Shopping Cart** | Session-based cart with dynamic navbar counter, quantity steppers, and promo codes | ✅ Complete |
| **Order Processing** | Complete checkout flow creating persistent orders with status tracking and order history | ✅ Complete |
| **User Registration / Login** | Secure bcrypt password hashing, input validation, session management, and demo login | ✅ Complete |
| **Database Storage** | Dual-mode: MongoDB (via Mongoose) + Zero-Config embedded persistent storage (`data/store.json`) | ✅ Complete |
| **Tech Stack Compliance** | Frontend: HTML (EJS), CSS, JavaScript &bull; Backend: Express.js (Node.js) | ✅ Complete |

---

## Features

- **Storefront & Catalog**:
  - Hero banner with quick call-to-actions and customer trust metrics.
  - Interactive category filter pills: *All Items*, *Electronics & Audio*, *Apparel & Footwear*, *Home & Kitchen*, *Travel & Gear*.
  - Real-time keyword search bar and multi-criteria sorting (Price Low/High, Rating, Featured).
  - High-resolution imagery, star reviews, stock badges (*Bestseller*, *Hot Deal*, *Staff Pick*).

- **Product Details**:
  - Dedicated `/products/:id` page with breadcrumb navigation.
  - Live stock inventory indicator.
  - Key specification highlights and related product recommendations.

- **Shopping Cart & Checkout**:
  - Interactive cart table with quantity increment/decrement and item removal.
  - Dynamic Free Express Shipping tracker (*Add $X for free shipping*).
  - Promotional discount coupon engine (try code **`ALPHA10`** for 10% off or **`HALO20`** for 20% off).
  - Seamless checkout converting carts into trackable orders.

- **Authentication & Security**:
  - User registration and login protected by **bcrypt** password hashing.
  - Session-based auth with automatic post-login redirection to intended pages (`returnTo`).
  - Pre-filled one-click demo login button for swift evaluator testing.

- **Dual-Mode Resilient Database**:
  - **Zero-Config Standalone Mode**: Works immediately out of the box with zero external database dependencies needed (stores persistent data in `data/store.json`).
  - **MongoDB Mode**: Connects seamlessly to MongoDB Atlas or local MongoDB when `MONGO_URI` is provided in `.env`.

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (HTML templates), Modern Responsive CSS, Client-side JavaScript
- **Database:** MongoDB (via Mongoose) with Zero-Config embedded JSON fallback
- **Auth & Security:** Express-Session, BcryptJS

---

## Quick Start Instructions

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Wave-eer/CodeAlpha_ECommerceStore.git
cd CodeAlpha_ECommerceStore
npm install
```

### 2. Configure Environment (Optional)
The application works immediately without configuration. If you wish to connect MongoDB Atlas:
```bash
cp .env.example .env
```
Add your connection string:
```env
PORT=3000
SESSION_SECRET=your_secret_key
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/codealpha_store
```

### 3. Run the Application
```bash
npm start
```
Visit **`http://localhost:3000`** in your browser.