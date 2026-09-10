const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Store = require('../config/store');
const { requireLogin } = require('../middleware/auth');

// Checkout: convert session cart into an Order
router.post('/checkout', requireLogin, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.session.flash = { type: 'warning', message: 'Your cart is empty. Add some products before checking out!' };
      return res.redirect('/cart');
    }

    const items = [];
    let subtotal = 0;

    for (const entry of cart) {
      let product = await Product.findById(entry.productId);
      if (!product) {
        product = Store.defaultProducts.find(p => p._id.toString() === entry.productId);
      }
      if (product) {
        const lineTotal = product.price * entry.quantity;
        items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: entry.quantity,
          imageUrl: product.imageUrl
        });
        subtotal += lineTotal;
      }
    }

    if (items.length === 0) {
      req.session.cart = [];
      return res.redirect('/cart');
    }

    const discountRate = req.session.discountRate || 0;
    const discount = subtotal * discountRate;
    const shipping = subtotal >= 50 ? 0 : 4.99;
    const totalAmount = Math.max(0, subtotal - discount + shipping);

    const order = await Order.create({
      user: req.session.userId,
      items,
      totalAmount: Number(totalAmount.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      status: 'Processing'
    });

    // Clear cart and promotional state
    req.session.cart = [];
    delete req.session.discountRate;
    delete req.session.promoCode;

    req.session.flash = {
      type: 'success',
      message: 'Order #' + order._id.toString().slice(-8).toUpperCase() + ' placed successfully! We are preparing your shipment.'
    };

    res.redirect('/orders');
  } catch (err) {
    console.error('Checkout error:', err);
    req.session.flash = { type: 'danger', message: 'There was an issue processing your order. Please try again.' };
    res.redirect('/cart');
  }
});

// Order history
router.get('/orders', requireLogin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render('orders', { orders: orders || [] });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.render('orders', { orders: [] });
  }
});

module.exports = router;
