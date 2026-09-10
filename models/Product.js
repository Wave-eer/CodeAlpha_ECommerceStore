const mongoose = require('mongoose');
const Store = require('../config/store');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'general' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  description: { type: String, required: true },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
  stock: { type: Number, default: 10 },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 24 },
  badge: { type: String, default: '' },
  features: [{ type: String }]
}, { timestamps: true });

const MongooseProduct = mongoose.models.Product || mongoose.model('Product', productSchema);

const Product = new Proxy(MongooseProduct, {
  get(target, prop) {
    if (prop === 'db') {
      return mongoose.connection;
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    }
    if (prop in Store.Product) {
      return typeof Store.Product[prop] === 'function' ? Store.Product[prop].bind(Store.Product) : Store.Product[prop];
    }
    return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
  }
});

module.exports = Product;
