
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

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
