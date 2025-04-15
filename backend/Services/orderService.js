// services/orderService.js
const Order = require('../Models/Products/Order');
const Customer = require('../Models/User/Roles/Customer');

const createOrderFromCart = async (userId, sellerId, doctor, prescription_image, payment_method) => {
  try {
    const customer = await Customer.findById(userId).populate('cart.product');

    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    if (customer.cart.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }

    const items = customer.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));

    const newOrder = new Order({
      customer: userId,
      seller: sellerId,
      items,
      doctor,
      prescription_image,
      payment_method,
    });

    await newOrder.save();

    // Clear the cart
    customer.cart = [];
    await customer.save();

    return { success: true, message: 'Order placed successfully', order: newOrder };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.status = status;
    await order.save();

    return { success: true, message: 'Order status updated successfully', order };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('customer seller items.product');

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return { success: true, order };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getOrdersByCustomerId = async (customerId) => {
  try {
    const orders = await Order.find({ customer: customerId }).populate('customer seller items.product');

    if (!orders || orders.length === 0) {
      return { success: false, message: 'No orders found for this customer' };
    }

    return { success: true, orders };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getOrdersBySellerId = async (sellerId) => {
  try {
    const orders = await Order.find({ seller: sellerId }).populate('customer seller items.product');

    if (!orders || orders.length === 0) {
      return { success: false, message: 'No orders found for this seller' };
    }

    return { success: true, orders };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getOrders = async () => {
  try {
    const orders = await Order.find().populate('customer seller items.product');

    if (!orders || orders.length === 0) {
      return { success: false, message: 'No orders found' };
    }

    return { success: true, orders };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const trackOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return { success: true, status: order.status };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
const cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.status = 'cancelled';
    await order.save();

    return { success: true, message: 'Order cancelled successfully', order };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
    createOrderFromCart,
    updateOrderStatus,
    getOrderById,
    getOrdersByCustomerId,
    getOrdersBySellerId,
    getOrders,
    trackOrder,
    cancelOrder,
};
