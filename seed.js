require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Wireless Headphones',
    description: 'Comfortable over-ear wireless headphones with noise cancellation.',
    price: 59.99,
    imageUrl: 'https://via.placeholder.com/300x200?text=Headphones',
    stock: 15,
    category: 'electronics'
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with breathable mesh upper.',
    price: 79.99,
    imageUrl: 'https://via.placeholder.com/300x200?text=Shoes',
    stock: 20,
    category: 'fashion'
  },
  {
    name: 'Coffee Maker',
    description: '12-cup programmable coffee maker with auto shut-off.',
    price: 34.99,
    imageUrl: 'https://via.placeholder.com/300x200?text=Coffee+Maker',
    stock: 10,
    category: 'home'
  },
  {
    name: 'Backpack',
    description: 'Durable 25L backpack with laptop compartment.',
    price: 44.99,
    imageUrl: 'https://via.placeholder.com/300x200?text=Backpack',
    stock: 25,
    category: 'fashion'
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);
  console.log('Sample products inserted!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
