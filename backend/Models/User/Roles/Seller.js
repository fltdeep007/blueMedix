const User = require('../User');
const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  desc: {
    type: String,
    default: '',
  },
  complaints: {
    type: String,
    default: '',
  }
});

const Seller = User.discriminator('Seller', sellerSchema);
module.exports = Seller;
