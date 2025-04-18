const User = require('../User');
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({

    cart: [{
        product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', 
        required: true,
        },
        quantity: {
        type: Number,
        default: 1,
        }
    }],
});

customerSchema.virtual('total_price').get(function () {
    if (!this.populated('cart.product')) return undefined;
  
    return this.cart.reduce((sum, item) => {
      const price = parseFloat(item.product.price.toString());
      return sum + price * item.quantity;
    }, 0);
  });

const Customer = User.discriminator('Customer', customerSchema);
module.exports = Customer;
