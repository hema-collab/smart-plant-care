const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const db = require('../models/db');
const { authenticateToken, requireAdmin } = require('./authMiddleware');

// Apply admin protection to all routes below
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const users = db.find('users');
    const products = Product.findAll();
    const orders = Order.findAll();

    const totalUsers = users.length;
    const totalOrders = orders.length;

    // Calculate revenue (excluding cancelled orders)
    const totalSales = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Identify low stock products
    const lowStockProducts = products.filter(p => p.stock < 10);

    // Categorize sales totals
    const salesByCategory = {};
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        o.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          const category = product ? product.category : 'Unknown';
          salesByCategory[category] = (salesByCategory[category] || 0) + (item.price * item.quantity);
        });
      }
    });

    // Tabulate order statuses
    const statusCounts = { Pending: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    res.json({
      totalUsers,
      totalOrders,
      totalSales: Number(totalSales.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      salesByCategory,
      statusCounts,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  try {
    const orders = Order.findAll();
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid order status option.' });
    }

    const updatedCount = Order.updateStatus(req.params.id, status);
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ message: 'Order status updated successfully.', orderId: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products
router.post('/products', (req, res) => {
  try {
    const { name, category, price, stock, description, imageUrl, purchaseLinks } = req.body;
    if (!name || !category || price === undefined || stock === undefined || !description) {
      return res.status(400).json({ error: 'Please provide all required product details.' });
    }

    const newProduct = Product.create({
      name,
      category,
      price: Number(price),
      stock: Number(stock),
      description,
      imageUrl: imageUrl || '/images/default_product.jpg',
      purchaseLinks: purchaseLinks || {}
    });

    res.status(201).json({ message: 'Product catalog entry added.', product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', (req, res) => {
  try {
    const { name, category, price, stock, description, imageUrl, purchaseLinks } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (purchaseLinks !== undefined) updateData.purchaseLinks = purchaseLinks;

    const updatedCount = Product.update(req.params.id, updateData);
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product catalog entry updated.', productId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  try {
    const deletedCount = Product.delete(req.params.id);
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully.', productId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
