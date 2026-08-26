const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: 'https://via.placeholder.com/300x200?text=Product' },
  stock: { type: Number, default: 10 },
  category: { type: String, default: 'general' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
