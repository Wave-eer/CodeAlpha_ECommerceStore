const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection notice:', err.message);
  }
}

module.exports = connectDB;
