const mongoose = require('mongoose');

const baseOptions = {
  discriminatorKey: 'role',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'Users',
};

const userSchema = new mongoose.Schema({
  schema: {
    type: Number,
    required: true,
    default: 1,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },

  address: {
    first_line: {
      type: String,
      required: true,
    },
    second_line: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pin_code: {
      type: Number,
      required: true,
    },
  },
  
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'other']
    },
  date_of_birth: {
    type: Date,
    required: true,
  },

  e_mail: {
    type: String,
    required: true,
    unique: true,
  },
  phone_no: {
    type: Number,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
}, baseOptions);

const User = mongoose.model('User', userSchema);

module.exports = User;
