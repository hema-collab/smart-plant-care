const db = require('./db');
const COLLECTION = 'diseases';

const Disease = {
  findAll: (query = {}) => {
    return db.find(COLLECTION, query);
  },

  findById: (id) => {
    return db.findOne(COLLECTION, { id });
  },

  findByPlantAndName: (plantType, name) => {
    return db.findOne(COLLECTION, { plantType, name });
  },

  create: (diseaseData) => {
    return db.insert(COLLECTION, diseaseData);
  },

  update: (id, diseaseData) => {
    return db.update(COLLECTION, { id }, diseaseData);
  },

  delete: (id) => {
    return db.delete(COLLECTION, { id });
  }
};

module.exports = Disease;
