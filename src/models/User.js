const db = require('./db');
const bcrypt = require('bcryptjs');

const COLLECTION = 'users';

const User = {
  create: async (username, email, password, role = 'user') => {
    // Check if user exists
    const existing = db.findOne(COLLECTION, { email });
    if (existing) throw new Error('Email already registered');
    
    const existingUsername = db.findOne(COLLECTION, { username });
    if (existingUsername) throw new Error('Username already taken');

    const passwordHash = await bcrypt.hash(password, 10);
    return db.insert(COLLECTION, {
      username,
      email,
      passwordHash,
      role
    });
  },

  findByEmail: (email) => {
    return db.findOne(COLLECTION, { email });
  },

  findById: (id) => {
    return db.findOne(COLLECTION, { id });
  },

  verifyPassword: async (user, password) => {
    return bcrypt.compare(password, user.passwordHash);
  }
};

module.exports = User;
