const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<username>')) {
    console.log('[Database] Operating in Zero-Config Embedded Storage mode (data/store.json).');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log('[Database] MongoDB connected successfully.');
  } catch (err) {
    console.warn('[Database] MongoDB connection attempt failed (' + err.message + ').');
    console.log('[Database] Seamlessly falling back to embedded local storage (data/store.json).');
  }
}

module.exports = connectDB;
