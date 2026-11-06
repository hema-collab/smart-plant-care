const db = require('./db');
const COLLECTION = 'orders';

const Order = {
  findAll: (query = {}) => {
    return db.find(COLLECTION, query);
  },

  findById: (id) => {
    return db.findOne(COLLECTION, { id });
  },

  findByUserId: (userId) => {
    return db.find(COLLECTION, { userId });
  },

  create: (orderData) => {
    return db.insert(COLLECTION, orderData);
  },

  updateStatus: (id, status) => {
    return db.update(COLLECTION, { id }, { status });
  }
};

module.exports = Order;
