const mongoose = require('mongoose');
const User = require('../User');

const sellerSchema = new mongoose.Schema({
  desc: {
    type: String,
    default: '',
  },
  complaints: {
    type: String,
    default: '',
  },
  orders: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  }
});

const Seller = User.discriminator('Seller', sellerSchema);
module.exports = Seller;