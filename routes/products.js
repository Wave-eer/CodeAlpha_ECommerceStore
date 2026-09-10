const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../config/store');

// Homepage: list products with search, category filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const selectedCategory = (req.query.category || 'all').toLowerCase();
    const searchQuery = (req.query.q || '').trim().toLowerCase();
    const sortBy = req.query.sort || 'featured';

    let allProducts = await Product.find({});
    if (!allProducts || allProducts.length === 0) {
      allProducts = Store.defaultProducts;
    }

    let filtered = [...allProducts];

    // Filter by Category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(searchQuery);
        const descMatch = p.description && p.description.toLowerCase().includes(searchQuery);
        const catMatch = p.category && p.category.toLowerCase().includes(searchQuery);
        return nameMatch || descMatch || catMatch;
      });
    }

    // Sort Products
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const categories = [
      { id: 'all', label: 'All Items' },
      { id: 'electronics', label: 'Electronics & Audio' },
      { id: 'fashion', label: 'Apparel & Footwear' },
      { id: 'home', label: 'Home & Kitchen' },
      { id: 'lifestyle', label: 'Travel & Gear' }
    ];

    res.render('index', {
      products: filtered,
      categories,
      selectedCategory,
      searchQuery,
      sortBy,
      totalCount: filtered.length
    });
  } catch (err) {
    console.error('Error loading products for homepage:', err);
    res.render('index', {
      products: Store.defaultProducts,
      categories: [
        { id: 'all', label: 'All Items' },
        { id: 'electronics', label: 'Electronics & Audio' },
        { id: 'fashion', label: 'Apparel & Footwear' },
        { id: 'home', label: 'Home & Kitchen' },
        { id: 'lifestyle', label: 'Travel & Gear' }
      ],
      selectedCategory: 'all',
      searchQuery: '',
      sortBy: 'featured',
      totalCount: Store.defaultProducts.length
    });
  }
});

// Product details page
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) {
      const fallback = Store.defaultProducts.find(p => p._id.toString() === id);
      if (fallback) product = fallback;
    }

    if (!product) {
      return res.status(404).render('404', {
        title: 'Product Not Found',
        message: 'The requested product could not be found.'
      });
    }

    // Load related products
    let allProducts = await Product.find({});
    if (!allProducts || allProducts.length === 0) allProducts = Store.defaultProducts;
    const relatedProducts = allProducts
      .filter(p => p._id.toString() !== product._id.toString() && (p.category === product.category || !product.category))
      .slice(0, 3);

    res.render('product-details', {
      product,
      relatedProducts
    });
  } catch (err) {
    console.error('Error loading product details:', err);
    res.status(404).redirect('/');
  }
});

module.exports = router;
