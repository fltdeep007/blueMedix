// models/Product.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    schema: {
        type: Number,
        required: true,
        default: 1 
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },


    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [
        {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
        }
    ],

    payment_method: {
        type: String,
        enum: ['credit_card', 'UPI', 'netbanking', "cash_on_delivery", "debit_card"],
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },

    doctor: {
        type: String,
        required: true,
        
    },

    prescription_image: {
        type: String,
        required: true
    }

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
