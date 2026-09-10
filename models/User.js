const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Store = require('../config/store');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

const User = new Proxy(MongooseUser, {
  get(target, prop) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    }
    if (prop in Store.User) {
      return typeof Store.User[prop] === 'function' ? Store.User[prop].bind(Store.User) : Store.User[prop];
    }
    return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
  }
});

module.exports = User;
