const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: String,
  gender: String,
  date_of_birth: Date,
  e_mail: { type: String, unique: true },
  password: String,
  phone_no: String,
  region: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  role: String,
  desc: String,
  complaints: String,
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);
