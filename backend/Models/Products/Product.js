// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  schema: {
    type: Number,
    required: true,
    default: 1 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image_link: {
    type: String,
    required: true
  },
  price: {
    type: mongoose.Types.Decimal128,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', 
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
