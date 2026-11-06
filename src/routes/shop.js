const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('./authMiddleware');

// GET /api/products
router.get('/products', (req, res) => {
  try {
    let products = Product.findAll();
    const { category, search, sort } = req.query;

    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }

    if (sort) {
      if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/products/:id', (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkout
router.post('/checkout', authenticateToken, (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !items.length || !shippingAddress) {
      return res.status(400).json({ error: 'Missing shipping address or items in cart.' });
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // Verify stock first to prevent partial checkouts
    for (const item of items) {
      const product = Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Only ${product.stock} units remaining.` });
      }
      calculatedTotal += product.price * item.quantity;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
    }

    // Deduct stock and commit changes
    for (const item of items) {
      const product = Product.findById(item.productId);
      Product.update(product.id, { stock: product.stock - item.quantity });
    }

    // Record the order
    const order = Order.create({
      userId: req.user.id,
      customerName: req.user.username,
      email: req.user.email,
      shippingAddress,
      items: validatedItems,
      totalAmount: Number(calculatedTotal.toFixed(2)),
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Order successfully placed!',
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/my-orders
router.get('/orders/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = Order.findByUserId(req.user.id);
    // Sort descending by creation date (newest orders first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
