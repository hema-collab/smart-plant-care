const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readData(collection) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
}

function writeData(collection, data) {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
    return false;
  }
}

// Generates a simple ID
function generateId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Matches query object (simple equality check)
function matches(item, query) {
  for (const key in query) {
    if (query[key] !== item[key]) {
      return false;
    }
  }
  return true;
}

const db = {
  find: (collection, query = {}) => {
    const data = readData(collection);
    return data.filter(item => matches(item, query));
  },

  findOne: (collection, query = {}) => {
    const data = readData(collection);
    return data.find(item => matches(item, query)) || null;
  },

  insert: (collection, doc) => {
    const data = readData(collection);
    const newDoc = { id: generateId(), ...doc, createdAt: new Date().toISOString() };
    data.push(newDoc);
    writeData(collection, data);
    return newDoc;
  },

  update: (collection, query, updateData) => {
    const data = readData(collection);
    let updatedCount = 0;
    const updatedData = data.map(item => {
      if (matches(item, query)) {
        updatedCount++;
        const merged = { ...item, ...updateData, updatedAt: new Date().toISOString() };
        merged.id = item.id; // Keep primary key immutable
        return merged;
      }
      return item;
    });
    if (updatedCount > 0) {
      writeData(collection, updatedData);
    }
    return updatedCount;
  },

  delete: (collection, query) => {
    const data = readData(collection);
    const initialLength = data.length;
    const filtered = data.filter(item => !matches(item, query));
    if (filtered.length !== initialLength) {
      writeData(collection, filtered);
    }
    return initialLength - filtered.length;
  },

  seed: (collection, defaultData) => {
    const data = readData(collection);
    if (data.length === 0) {
      writeData(collection, defaultData);
      return true;
    }
    return false;
  }
};

module.exports = db;
