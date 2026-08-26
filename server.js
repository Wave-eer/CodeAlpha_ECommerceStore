require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const { attachUser } = require('./middleware/auth');

const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();

// Connect to MongoDB asynchronously without blocking server start
connectDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

let sessionStore;
if (process.env.MONGO_URI && process.env.USE_MONGO_STORE === 'true') {
  sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    mongoOptions: { serverSelectionTimeoutMS: 2000 }
  });
  sessionStore.on('error', err => console.log('MongoStore session notice:', err.message));
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  ...(sessionStore ? { store: sessionStore } : {}),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

app.use(attachUser);

// Routes
app.use('/', productRoutes);
app.use('/auth', authRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
