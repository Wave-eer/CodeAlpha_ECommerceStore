const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../config/store');

// Helper: get cart from session
function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

// View cart (open to all, login required for checkout)
router.get('/cart', async (req, res) => {
  try {
    const cart = getCart(req);
    const items = [];
    let subtotal = 0;

    for (const entry of cart) {
      let product = await Product.findById(entry.productId);
      if (!product) {
        product = Store.defaultProducts.find(p => p._id.toString() === entry.productId);
      }
      if (product) {
        const lineTotal = product.price * entry.quantity;
        subtotal += lineTotal;
        items.push({
          product,
          quantity: entry.quantity,
          subtotal: lineTotal
        });
      }
    }

    const discountRate = req.session.discountRate || 0;
    const promoCode = req.session.promoCode || null;
    const discount = subtotal * discountRate;
    const shipping = subtotal > 0 ? (subtotal >= 50 ? 0 : 4.99) : 0;
    const total = Math.max(0, subtotal - discount + shipping);

    res.render('cart', {
      items,
      subtotal,
      discount,
      discountRate,
      promoCode,
      shipping,
      total,
      promoError: req.session.promoError || null,
      promoSuccess: req.session.promoSuccess || null
    });

    delete req.session.promoError;
    delete req.session.promoSuccess;
  } catch (err) {
    console.error('Error rendering cart:', err);
    res.redirect('/');
  }
});

// Add to cart
router.post('/cart/add/:productId', async (req, res) => {
  try {
    const cart = getCart(req);
    const { productId } = req.params;
    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);

    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    req.session.flash = {
      type: 'success',
      message: 'Item added to your cart.'
    };

    if (req.body.buyNow === 'true') {
      return res.redirect('/cart');
    }

    const referrer = req.get('Referrer');
    if (referrer && !referrer.includes('/cart')) {
      return res.redirect(referrer);
    }
    res.redirect('/cart');
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.redirect('/cart');
  }
});

// Update quantity
router.post('/cart/update/:productId', (req, res) => {
  const cart = getCart(req);
  const { productId } = req.params;
  const quantity = parseInt(req.body.quantity);

  const item = cart.find(item => item.productId === productId);
  if (item) {
    if (isNaN(quantity) || quantity <= 0) {
      req.session.cart = cart.filter(i => i.productId !== productId);
    } else {
      item.quantity = Math.min(99, quantity);
    }
  }

  res.redirect('/cart');
});

// Remove from cart
router.post('/cart/remove/:productId', (req, res) => {
  req.session.cart = getCart(req).filter(item => item.productId !== req.params.productId);
  req.session.flash = { type: 'info', message: 'Item removed from cart.' };
  res.redirect('/cart');
});

// Apply promo coupon
router.post('/cart/promo', (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  if (code === 'ALPHA10' || code === 'WELCOME10') {
    req.session.discountRate = 0.10;
    req.session.promoCode = code;
    req.session.promoSuccess = 'Promo code ' + code + ' applied! 10% discount added.';
  } else if (code === 'HALO20') {
    req.session.discountRate = 0.20;
    req.session.promoCode = code;
    req.session.promoSuccess = 'VIP code ' + code + ' applied! 20% discount added.';
  } else {
    req.session.promoError = 'Invalid promo code ' + code + '. Try ALPHA10 for 10% off.';
  }
  res.redirect('/cart');
});

module.exports = router;
