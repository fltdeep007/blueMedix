
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  schema: {
    type: Number,
    required: true,
    default: 1
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  eventId: {
    type: String,
    required: true,
    enum: ['order_placed', 'order_cancelled', 'order_delivered'],
    default: 'order_placed'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for faster retrieval when querying by date ranges and products
transactionSchema.index({ timestamp: 1, product: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;