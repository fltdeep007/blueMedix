const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// 📥 Create a new order
router.post('/create', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();

    // Add order to customer
    await Customer.findByIdAndUpdate(req.body.customer, {
      $push: { orders: savedOrder._id },
    });

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📤 Get order by ID
router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// 📦 List all orders of a customer
router.get('/user/:userId', async (req, res) => {
  const orders = await Order.find({ customer: req.params.userId });
  res.json(orders);
});

module.exports = router;
