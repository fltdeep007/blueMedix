const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    first_line: {
      type: String,
      required: true
    },
    second_line: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pin_code: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'dispatched', 'delivered', 'rejected', 'cancelled'],
    default: 'pending'
  },
  prescription_image: {
    type: String,
    default: null
  },
  payment_method: {
    type: String,
    required: true,
    enum: ['cod', 'upi', 'wallet']
  },
  upi_id: {
    type: String,
    default: null
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  tracking: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;