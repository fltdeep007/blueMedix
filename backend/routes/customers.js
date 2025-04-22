const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// 📥 Create a new customer
router.post('/create', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    const saved = await newCustomer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all customers
router.get('/list', async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

//  Get a single customer
router.get('/:id', async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

module.exports = router;
