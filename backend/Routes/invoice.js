const express = require('express');
const router = express.Router();
const Order = require('../Models/Products/Order'); // Your MongoDB Order model

// @route   GET /invoice/:orderId
// @desc    Generate invoice details for a given order
// @access  Public or Protected (based on auth middleware)

router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'name email') // Populate customer details
      .populate('items.product', 'name'); // Populate product name in items

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const invoice = {
      orderId: order._id,
      customerName: order.customer ? order.customer.name : 'Guest Customer',
      customerEmail: order.customer ? order.customer.email : 'N/A',
      orderDate: order.createdAt,
      status: order.status,
      items: order.items.map((item) => ({
        name: item.product ? item.product.name : 'Product Details Not Available',
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    };

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;