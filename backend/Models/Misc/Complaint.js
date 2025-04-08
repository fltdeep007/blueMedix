// models/Product.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
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

    type: {
        type: String,
        required: true,
        enum: ['Missing', 'Damaged', 'Wrong Item','Expired', 'Other'],
        default: 'other'
    },

    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Resolved', 'Rejected'],
        default: 'Pending'
    },

    resolution: {
        type: {
            type: String,
            required: true,
            enum: ['Refund', 'Replacement', 'Partial Refund', "None"],
            default: null
        },

        amount: {
            type: Number,
            required: function() { return this.type === 'Refund' || this.type === 'Partial Refund'; },
            default: null
        },

        note: {
            type: String,
            required: true,
            default: null
        },
    },


}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Complaint= mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
