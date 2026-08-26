const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireLogin } = require('../middleware/auth');

// Helper: get cart from session (array of { productId, quantity })
function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

// View cart
router.get('/cart', requireLogin, async (req, res) => {
  const cart = getCart(req);
  const items = [];
  let total = 0;

  for (const entry of cart) {
    const product = await Product.findById(entry.productId);
    if (product) {
      const subtotal = product.price * entry.quantity;
      total += subtotal;
      items.push({ product, quantity: entry.quantity, subtotal });
    }
  }

  res.render('cart', { items, total });
});

// Add to cart
router.post('/cart/add/:productId', requireLogin, (req, res) => {
  const cart = getCart(req);
  const { productId } = req.params;
  const quantity = parseInt(req.body.quantity) || 1;

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  res.redirect('/cart');
});

// Update quantity
router.post('/cart/update/:productId', requireLogin, (req, res) => {
  const cart = getCart(req);
  const { productId } = req.params;
  const quantity = parseInt(req.body.quantity);

  const item = cart.find(item => item.productId === productId);
  if (item) {
    if (quantity <= 0) {
      req.session.cart = cart.filter(i => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }
  }

  res.redirect('/cart');
});

// Remove from cart
router.post('/cart/remove/:productId', requireLogin, (req, res) => {
  req.session.cart = getCart(req).filter(item => item.productId !== req.params.productId);
  res.redirect('/cart');
});

module.exports = router;
