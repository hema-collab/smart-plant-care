const db = require('./db');
const COLLECTION = 'products';

const Product = {
  findAll: (query = {}) => {
    return db.find(COLLECTION, query);
  },

  findById: (id) => {
    return db.findOne(COLLECTION, { id });
  },

  create: (productData) => {
    return db.insert(COLLECTION, productData);
  },

  update: (id, productData) => {
    return db.update(COLLECTION, { id }, productData);
  },

  delete: (id) => {
    return db.delete(COLLECTION, { id });
  }
};

module.exports = Product;
