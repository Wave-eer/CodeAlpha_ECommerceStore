const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { requireLogin } = require('../middleware/auth');

// Checkout: turn session cart into an Order
router.post('/checkout', requireLogin, async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');

  const items = [];
  let totalAmount = 0;

  for (const entry of cart) {
    const product = await Product.findById(entry.productId);
    if (product) {
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: entry.quantity
      });
      totalAmount += product.price * entry.quantity;
    }
  }

  await Order.create({
    user: req.session.userId,
    items,
    totalAmount
  });

  req.session.cart = []; // clear cart after order
  res.redirect('/orders');
});

// Order history
router.get('/orders', requireLogin, async (req, res) => {
  const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
  res.render('orders', { orders });
});

module.exports = router;
