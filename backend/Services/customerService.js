const Product = require('../Models/Products/Product'); 
const Customer = require('../Models/User/Roles/Customer');

const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const customer = await Customer.findById(userId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const itemIndex = customer.cart.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      customer.cart[itemIndex].quantity += quantity;
    } else {
      customer.cart.push({ product: productId, quantity });
    }

    await customer.save();
    return { success: true, message: 'Item added to cart', cart: customer.cart };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const removeFromCart = async (userId, productId) => {
  try {
    const customer = await Customer.findById(userId);
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    const initialLength = customer.cart.length;

    customer.cart = customer.cart.filter(
      item => item.product.toString() !== productId
    );

    if (customer.cart.length === initialLength) {
      return { success: false, message: 'Item not found in cart' };
    }

    await customer.save();

    return { success: true, message: 'Item removed from cart', cart: customer.cart };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getCart = async (userId) => {
  try {
    const customer = await Customer.findById(userId).populate('cart.product');

    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    const cartItems = customer.cart.map(item => ({
      product: {
        id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        description: item.product.description,
        image: item.product.image_link,
        discount: item.product.discount,
      },
      quantity: item.quantity
    }));

    return {
      success: true,
      cart: cartItems
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  getCart
};