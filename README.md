# CodeAlpha_ECommerceStore

A simple e-commerce store built for the **CodeAlpha Full Stack Development Internship — Task 1**.

## Features
- Product listing & product details page
- User registration & login (passwords hashed with bcrypt, sessions stored in MongoDB)
- Shopping cart (add, update quantity, remove)
- Order processing (checkout creates an order, cart clears, order history page)
- MongoDB database for products, users, and orders

## Tech Stack
- **Frontend:** EJS templates, HTML, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Auth:** express-session + bcryptjs

## Setup Instructions

1. **Clone the repo & install dependencies**
   ```bash
   npm install
   ```

2. **Create a MongoDB database**
   - Easiest option: create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Get your connection string (looks like `mongodb+srv://user:pass@cluster0.mongodb.net/dbname`)

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your own `MONGO_URI` and `SESSION_SECRET`.

4. **Seed sample products** (optional but recommended)
   ```bash
   npm run seed
   ```

5. **Run the app**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` in your browser.

## Project Structure
```
├── config/db.js          # MongoDB connection
├── models/                # Mongoose schemas (Product, User, Order)
├── routes/                 # Express route handlers
├── middleware/auth.js       # Login-required middleware
├── views/                    # EJS templates
├── public/css/style.css       # Styling
├── seed.js                     # Sample product seeder
└── server.js                    # App entry point
```

## Notes
This project was built as part of the CodeAlpha internship program. It demonstrates a full CRUD flow (create products via seed, read/browse products, update cart quantities, and create orders) along with authentication and session management.
