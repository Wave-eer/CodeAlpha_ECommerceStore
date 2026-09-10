const mongoose = require('mongoose');
const Store = require('../config/store');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  status: { type: String, default: 'Placed' }
}, { timestamps: true });

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', orderSchema);

const Order = new Proxy(MongooseOrder, {
  get(target, prop) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    }
    if (prop in Store.Order) {
      return typeof Store.Order[prop] === 'function' ? Store.Order[prop].bind(Store.Order) : Store.Order[prop];
    }
    return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
  }
});

module.exports = Order;
