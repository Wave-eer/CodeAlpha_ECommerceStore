const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const sampleProducts = [
  {
    _id: '66c5a0110000000000000001',
    name: 'Wireless Headphones',
    description: 'Comfortable over-ear wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    stock: 15,
    category: 'electronics'
  },
  {
    _id: '66c5a0110000000000000002',
    name: 'Running Shoes',
    description: 'Lightweight performance running shoes with breathable mesh upper and responsive cushioning.',
    price: 79.99,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    stock: 20,
    category: 'fashion'
  },
  {
    _id: '66c5a0110000000000000003',
    name: 'Coffee Maker',
    description: '12-cup programmable coffee maker with auto shut-off and thermal carafe.',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80',
    stock: 10,
    category: 'home'
  },
  {
    _id: '66c5a0110000000000000004',
    name: 'Backpack',
    description: 'Durable 25L waterproof travel backpack with padded laptop compartment.',
    price: 44.99,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    stock: 25,
    category: 'fashion'
  }
];

// Homepage: list all products
router.get('/', async (req, res) => {
  try {
    let products = [];
    if (Product.db.readyState === 1) {
      products = await Product.find().sort({ createdAt: -1 });
    }
    if (!products || products.length === 0) {
      products = sampleProducts;
    }
    res.render('index', { products });
  } catch (err) {
    res.render('index', { products: sampleProducts });
  }
});

// Product details page
router.get('/products/:id', async (req, res) => {
  try {
    let product = null;
    if (Product.db.readyState === 1) {
      product = await Product.findById(req.params.id);
    }
    if (!product) {
      product = sampleProducts.find(p => p._id.toString() === req.params.id);
    }
    if (!product) return res.status(404).send('Product not found');
    res.render('product-details', { product });
  } catch (err) {
    const product = sampleProducts.find(p => p._id.toString() === req.params.id);
    if (!product) return res.status(404).send('Product not found');
    res.render('product-details', { product });
  }
});

module.exports = router;
