const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const defaultProducts = [
  {
    _id: '66c5a0110000000000000001',
    name: 'AcousticPro Wireless ANC Headphones',
    category: 'electronics',
    price: 79.99,
    originalPrice: 119.99,
    description: 'Immersive sound with hybrid active noise cancellation, 40-hour battery life, fast charging, and memory-foam ear cushions designed for all-day comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80',
    stock: 18,
    rating: 4.8,
    reviewsCount: 142,
    badge: 'Bestseller',
    features: ['Active Noise Cancellation (ANC)', '40-Hour Playtime & USB-C Fast Charge', 'Built-in Dual HD Microphones', 'Bluetooth 5.3 Multi-Point Connect']
  },
  {
    _id: '66c5a0110000000000000002',
    name: 'AeroStride Breathable Running Shoes',
    category: 'fashion',
    price: 64.99,
    originalPrice: 89.99,
    description: 'Engineered with responsive foam cushioning, ultra-breathable engineered knit upper, and high-traction rubber outsole for pavement and trail.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80',
    stock: 24,
    rating: 4.7,
    reviewsCount: 98,
    badge: 'Hot Deal',
    features: ['Shock-Absorbing EVA Midsole', 'Seamless Breathable Mesh Upper', 'Anti-Slip Grippy Rubber Outsole', 'Ultra Lightweight: 240g']
  },
  {
    _id: '66c5a0110000000000000003',
    name: 'BaristaTouch Cold Brew & Coffee Maker',
    category: 'home',
    price: 49.99,
    originalPrice: 69.99,
    description: 'Precision temperature programmable coffee system with 12-cup insulated stainless thermal carafe, bold brew selector, and 24h delay timer.',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=700&q=80',
    stock: 12,
    rating: 4.9,
    reviewsCount: 230,
    badge: 'Staff Pick',
    features: ['Double-Walled Stainless Steel Carafe', 'Programmable 24-Hour Brew Timer', 'Reusable Gold-Tone Mesh Filter', 'Auto Shut-Off & Keep Warm']
  },
  {
    _id: '66c5a0110000000000000004',
    name: 'Vanguard Weatherproof Commuter Backpack',
    category: 'lifestyle',
    price: 54.99,
    originalPrice: 75.00,
    description: 'Rugged 28L expandable travel pack with padded 16\" laptop compartment, water-repellent Cordura fabric, hidden anti-theft pocket, and luggage strap.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&q=80',
    stock: 20,
    rating: 4.6,
    reviewsCount: 87,
    badge: 'Popular',
    features: ['Water-Resistant 900D Nylon', 'Dedicated 16-Inch Padded Laptop Sleeve', 'Ergonomic Breathable Back Padding', 'Integrated USB Pass-through Port']
  },
  {
    _id: '66c5a0110000000000000005',
    name: 'AuraPulse Fitness & Health Smartwatch',
    category: 'electronics',
    price: 44.99,
    originalPrice: 59.99,
    description: 'Vibrant 1.43\" AMOLED always-on display, 24/7 heart rate and blood oxygen monitoring, 30+ workout modes, and 10-day battery standby.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=80',
    stock: 30,
    rating: 4.5,
    reviewsCount: 65,
    badge: 'New',
    features: ['1.43\" High-Res AMOLED Touchscreen', 'Heart Rate & SpO2 Biometrics', '5ATM Water Resistance (50m)', 'Up to 10-Day Battery Life']
  },
  {
    _id: '66c5a0110000000000000006',
    name: 'ErgoRise Aluminum Laptop Stand',
    category: 'electronics',
    price: 29.99,
    originalPrice: 39.99,
    description: 'CNC-machined anodized aluminum riser with 6 adjustable height angles, open ventilation cooling design, and anti-slip silicone cushions.',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=80',
    stock: 40,
    rating: 4.8,
    reviewsCount: 184,
    badge: 'Bestseller',
    features: ['Heavy-Duty Aerospace Aluminum', '6 Ergonomic Height Settings', 'Optimized Heat Dissipation', 'Folds Flat for Travel']
  },
  {
    _id: '66c5a0110000000000000007',
    name: 'Artisan Ceramic Pour-Over & Mug Set',
    category: 'home',
    price: 36.99,
    originalPrice: 48.00,
    description: 'Handcrafted matte black ceramic dripper and matching 14oz stoneware mug. Engineered spiral interior ribs for optimal coffee flow extraction.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&q=80',
    stock: 15,
    rating: 4.7,
    reviewsCount: 52,
    badge: 'Top Rated',
    features: ['High-Fired Durable Stoneware', 'Spiral Extraction Grooves', 'Dishwasher & Microwave Safe', 'Includes 40 Unbleached Cone Filters']
  },
  {
    _id: '66c5a0110000000000000008',
    name: 'Heritage Heavyweight Oversized Cotton Tee',
    category: 'fashion',
    price: 24.99,
    originalPrice: 32.00,
    description: '280 GSM 100% combed ring-spun organic cotton with reinforced ribbed collar, drop shoulders, and relaxed boxy drape that softens with every wash.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&q=80',
    stock: 50,
    rating: 4.6,
    reviewsCount: 114,
    badge: 'Essential',
    features: ['280 GSM Ultra-Durable Cotton', 'Pre-Shrunk & Colorfast Dye', 'Boxy Relaxed Streetwear Cut', 'Reinforced Double-Stitched Seams']
  }
];

function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (!data.products || data.products.length === 0) {
        data.products = defaultProducts;
        saveData(data);
      }
      return data;
    }
  } catch (err) {
    console.error('Error loading store.json:', err);
  }

  const initial = {
    products: defaultProducts,
    users: [],
    orders: []
  };
  saveData(initial);
  return initial;
}

function saveData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

function generateId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + random;
}

function wrapUser(user) {
  if (!user) return null;
  const clone = { ...user };
  clone.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  };
  return clone;
}

const Store = {
  Product: {
    find(filter = {}) {
      const data = loadData();
      let results = [...data.products];
      if (filter && typeof filter === 'object') {
        if (filter.category) {
          results = results.filter(p => p.category && p.category.toLowerCase() === filter.category.toLowerCase());
        }
      }
      const queryObj = {
        results,
        sort(sortObj = {}) {
          if (sortObj.createdAt === -1 || sortObj._id === -1) {
            this.results.reverse();
          }
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve(this.results).then(resolve, reject);
        }
      };
      return queryObj;
    },

    async findById(id) {
      if (!id) return null;
      const data = loadData();
      const strId = id.toString();
      const product = data.products.find(p => p._id.toString() === strId);
      return product ? { ...product } : null;
    },

    async findOne(filter = {}) {
      const data = loadData();
      if (filter._id) {
        return this.findById(filter._id);
      }
      return data.products[0] ? { ...data.products[0] } : null;
    },

    async create(doc) {
      const data = loadData();
      const newProduct = {
        _id: doc._id || generateId(),
        name: doc.name || '',
        description: doc.description || '',
        price: Number(doc.price) || 0,
        originalPrice: Number(doc.originalPrice) || Number(doc.price) || 0,
        imageUrl: doc.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        stock: doc.stock !== undefined ? Number(doc.stock) : 10,
        category: doc.category || 'general',
        rating: doc.rating || 5.0,
        reviewsCount: doc.reviewsCount || 1,
        badge: doc.badge || '',
        features: doc.features || [],
        createdAt: new Date().toISOString()
      };
      data.products.push(newProduct);
      saveData(data);
      return newProduct;
    },

    async deleteMany() {
      const data = loadData();
      data.products = [];
      saveData(data);
      return { deletedCount: data.products.length };
    },

    async insertMany(items) {
      const created = [];
      for (const item of items) {
        created.push(await this.create(item));
      }
      return created;
    }
  },

  User: {
    async findOne(filter = {}) {
      const data = loadData();
      if (filter.email) {
        const emailLower = filter.email.toString().toLowerCase().trim();
        const user = data.users.find(u => u.email && u.email.toLowerCase().trim() === emailLower);
        return wrapUser(user);
      }
      if (filter._id) {
        return this.findById(filter._id);
      }
      return null;
    },

    async findById(id) {
      if (!id) return null;
      const data = loadData();
      const strId = id.toString();
      const user = data.users.find(u => u._id.toString() === strId);
      return wrapUser(user);
    },

    async create(doc) {
      const data = loadData();
      const email = (doc.email || '').toLowerCase().trim();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(doc.password, salt);

      const newUser = {
        _id: generateId(),
        name: (doc.name || '').trim(),
        email: email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      data.users.push(newUser);
      saveData(data);
      return wrapUser(newUser);
    }
  },

  Order: {
    async create(doc) {
      const data = loadData();
      const newOrder = {
        _id: generateId(),
        user: doc.user,
        items: doc.items || [],
        totalAmount: Number(doc.totalAmount) || 0,
        discount: Number(doc.discount) || 0,
        status: doc.status || 'Placed',
        createdAt: new Date()
      };
      data.orders.push(newOrder);
      saveData(data);
      return {
        ...newOrder,
        createdAt: new Date(newOrder.createdAt)
      };
    },

    find(filter = {}) {
      const data = loadData();
      let results = [...data.orders];
      if (filter.user) {
        const userIdStr = filter.user.toString();
        results = results.filter(o => o.user && o.user.toString() === userIdStr);
      }
      const mapped = results.map(o => ({
        ...o,
        createdAt: new Date(o.createdAt)
      }));

      const queryObj = {
        results: mapped,
        sort(sortObj = {}) {
          if (sortObj.createdAt === -1) {
            this.results.sort((a, b) => b.createdAt - a.createdAt);
          }
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve(this.results).then(resolve, reject);
        }
      };
      return queryObj;
    },

    async findById(id) {
      if (!id) return null;
      const data = loadData();
      const strId = id.toString();
      const order = data.orders.find(o => o._id.toString() === strId);
      return order ? { ...order, createdAt: new Date(order.createdAt) } : null;
    }
  },

  defaultProducts
};

module.exports = Store;
