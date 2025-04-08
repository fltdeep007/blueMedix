// models/Product.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  schema: {
    type: Number,
    required: true,
    default: 1 
  },

  image_link: {
    type: String,
    required: true
 },

  name: {
    type: String,
    required: true,
    trim: true

  },
  description: {
    type: String,
    required: true,
  },

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
