const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Your MongoDB Order model

// @route   GET /invoice/:orderId
// @desc    Generate invoice details for a given order
// @access  Public or Protected (based on auth middleware)

router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('userId', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const invoice = {
      orderId: order._id,
      customerName: order.userId.name,
      customerEmail: order.userId.email,
      orderDate: order.createdAt,
      status: order.status,
      items: order.products.map((p) => ({
        name: p.productName || 'Medicine',
        quantity: p.quantity,
        price: p.price,
        total: p.price * p.quantity,
      })),
      totalAmount: order.totalAmount,
    };

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
