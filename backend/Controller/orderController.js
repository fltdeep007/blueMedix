// controllers/orderController.js
const Order = require('../Models/Products/Order');
const Product = require('../Models/Products/Product');
const Customer = require('../Models/User/Roles/Customer');
const Complaint = require('../Models/Misc/Complaint');
const Transaction = require('../Models/Misc/Transaction');
const mongoose = require('mongoose');

// Place new order
exports.placeOrder = async (req, res) => {
  try {
    const { 
      seller_id, 
      items, 
      payment_method, 
      doctor, 
      prescription_image 
    } = req.body;
    
    // Validate required fields
    if (!seller_id || !items || !payment_method || !doctor || !prescription_image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items must be a non-empty array' 
      });
    }
    
    // Check if products exist and have sufficient quantity
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product with ID ${item.product} not found` 
        });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity for product ${product.name}` 
        });
      }
    }
    
    // Create new order
    const newOrder = new Order({
      customer: req.user._id, // From auth middleware
      seller: seller_id,
      items,
      payment_method,
      doctor,
      prescription_image,
      status: 'pending'
    });
    
    const savedOrder = await newOrder.save();
    
    // Decrease product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } }
      );
    }
    
    // Create transaction record
    const transaction = new Transaction({
      order: savedOrder._id
      // Add other transaction details as needed
    });
    
    await transaction.save();
    
    // Clear customer's cart after successful order
    await Customer.findByIdAndUpdate(
      req.user._id,
      { $set: { cart: [] } }
    );
    
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error in placeOrder:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const order = await Order.findById(orderId)
      .populate('customer', 'name e_mail phone_no')
      .populate('seller', 'name')
      .populate('items.product', 'name price image_link');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if the user is authorized to view this order
    if (
      order.customer._id.toString() !== req.user._id.toString() && 
      order.seller._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'RegionalAdmin' && 
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
    }
    
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List customer orders
exports.listCustomerOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = { customer: req.user._id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const orders = await Order.find(query)
      .populate('seller', 'name')
      .populate('items.product', 'name price image_link')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    console.error('Error in listCustomerOrders:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Cancel order (customer)
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if the user is authorized to cancel this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order' });
    }
    
    // Check if order is in a state that can be cancelled
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel order in '${order.status}' status` 
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    await order.save();
    
    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }
      );
    }
    
    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error in cancelOrder:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const order = await Order.findById(orderId)
      .select('status created_at updated_at');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Create tracking details based on order status
    const trackingDetails = {
      orderId: order._id,
      status: order.status,
      timeline: [
        {
          status: 'Order Placed',
          timestamp: order.created_at,
          completed: true
        },
        {
          status: 'Processing',
          timestamp: order.status !== 'pending' ? order.updated_at : null,
          completed: order.status !== 'pending'
        },
        {
          status: 'Shipped',
          timestamp: order.status === 'shipped' || order.status === 'delivered' ? order.updated_at : null,
          completed: order.status === 'shipped' || order.status === 'delivered'
        },
        {
          status: 'Delivered',
          timestamp: order.status === 'delivered' ? order.updated_at : null,
          completed: order.status === 'delivered'
        }
      ]
    };
    
    // If cancelled, add cancellation to timeline
    if (order.status === 'cancelled') {
      trackingDetails.timeline.push({
        status: 'Cancelled',
        timestamp: order.updated_at,
        completed: true
      });
    }
    
    return res.status(200).json({
      success: true,
      tracking: trackingDetails
    });
  } catch (error) {
    console.error('Error in trackOrder:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Raise complaint
exports.raiseComplaint = async (req, res) => {
  try {
    const { order_id, description, issue_type } = req.body;
    
    if (!order_id || !description || !issue_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, description and issue type are required' 
      });
    }
    
    // Check if order exists
    const order = await Order.findById(order_id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if user is authorized to raise complaint for this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to raise complaint for this order' 
      });
    }
    
    // Create ticket ID
    const ticketId = 'CMPL-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);
    
    // Create new complaint
    const newComplaint = new Complaint({
      order: order_id,
      description,
      issue_type,
      ticket_id: ticketId,
      status: 'open',
      customer: req.user._id
    });
    
    const savedComplaint = await newComplaint.save();
    
    return res.status(201).json({
      success: true,
      message: 'Complaint raised successfully',
      ticket_id: ticketId,
      complaint: savedComplaint
    });
  } catch (error) {
    console.error('Error in raiseComplaint:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get customer cart
exports.getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .populate('cart.product', 'name price image_link discount quantity');
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Calculate total price
    let totalPrice = 0;
    customer.cart.forEach(item => {
      const price = parseFloat(item.product.price.toString());
      const discountedPrice = price - (price * (item.product.discount / 100));
      totalPrice += discountedPrice * item.quantity;
    });
    
    return res.status(200).json({
      success: true,
      cart: customer.cart,
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity = 1 } = req.body;
    
    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be greater than 0' 
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if product has sufficient quantity
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient product quantity available' 
      });
    }
    
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Check if product already in cart
    const existingItemIndex = customer.cart.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      customer.cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      customer.cart.push({
        product: productId,
        quantity
      });
    }
    
    await customer.save();
    
    // Return updated cart
    const updatedCustomer = await Customer.findById(req.user._id)
      .populate('cart.product', 'name price image_link discount');
    
    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update cart item
exports.updateCartItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { quantity } = req.body;
    
    if (!quantity) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }
    
    // If quantity is 0, remove the item
    if (quantity === 0) {
      return this.removeFromCart(req, res);
    }
    
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Find the cart item
    const cartItem = customer.cart.id(itemId);
    
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    
    // Check product availability
    const product = await Product.findById(cartItem.product);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient product quantity available' 
      });
    }
    
    // Update quantity
    cartItem.quantity = quantity;
    await customer.save();
    
    // Return updated cart
    const updatedCustomer = await Customer.findById(req.user._id)
      .populate('cart.product', 'name price image_link discount');
    
    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    const customer = await Customer.findById(req.user._id);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Find the cart item
    const cartItemIndex = customer.cart.findIndex(
      item => item._id.toString() === itemId
    );
    
    if (cartItemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    
    // Remove item from cart
    customer.cart.splice(cartItemIndex, 1);
    await customer.save();
    
    // Return updated cart
    const updatedCustomer = await Customer.findById(req.user._id)
      .populate('cart.product', 'name price image_link discount');
    
    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: updatedCustomer.cart
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Generate invoice
// controllers/orderController.js (continued)

// Generate invoice (continued)
exports.generateInvoice = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      
      const order = await Order.findById(orderId)
        .populate('customer', 'name address e_mail phone_no')
        .populate('seller', 'name')
        .populate('items.product', 'name price discount');
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      // Check if order is completed
      if (order.status !== 'delivered') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot generate invoice for incomplete order' 
        });
      }
      
      // Calculate invoice details
      let subtotal = 0;
      const items = order.items.map(item => {
        const price = parseFloat(item.product.price.toString());
        const discount = price * (item.product.discount / 100);
        const discountedPrice = price - discount;
        const itemTotal = discountedPrice * item.quantity;
        
        subtotal += itemTotal;
        
        return {
          name: item.product.name,
          price: price.toFixed(2),
          discount: discount.toFixed(2),
          discountedPrice: discountedPrice.toFixed(2),
          quantity: item.quantity,
          total: itemTotal.toFixed(2)
        };
      });
      
      // Calculate tax (for example, 18% GST)
      const taxRate = 0.18;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      
      // Generate invoice ID
      const invoiceId = 'INV-' + order._id.toString().slice(-6) + '-' + Date.now().toString().slice(-4);
      
      // Create invoice object
      const invoice = {
        invoiceId,
        orderId: order._id,
        date: new Date(),
        customer: {
          name: order.customer.name,
          email: order.customer.e_mail,
          phone: order.customer.phone_no,
          address: order.customer.address
        },
        seller: {
          name: order.seller.name
        },
        items,
        subtotal: subtotal.toFixed(2),
        taxRate: (taxRate * 100).toFixed(0) + '%',
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: order.payment_method
      };
      
      // In a real application, you would save this invoice to a database
      // For now, we'll just return it
      
      return res.status(200).json({
        success: true,
        message: 'Invoice generated successfully',
        invoice
      });
    } catch (error) {
      console.error('Error in generateInvoice:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  // Get invoice details
  exports.getInvoiceDetails = async (req, res) => {
    try {
      const invoiceId = req.params.invoiceId;
      
      // In a real application, you would retrieve the invoice from the database
      // For this example, we'll simulate not finding the invoice
      
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    } catch (error) {
      console.error('Error in getInvoiceDetails:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  // Update order status (Admin/Seller)
  exports.updateOrderStatus = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }
      
      // Validate status
      const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
      }
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      // Check authorization (only seller, regional admin, or super admin can update)
      if (
        order.seller.toString() !== req.user._id.toString() &&
        req.user.role !== 'RegionalAdmin' &&
        req.user.role !== 'Admin'
      ) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized to update this order' 
        });
      }
      
      // Handle product inventory if order is cancelled
      if (status === 'cancelled' && order.status !== 'cancelled') {
        // Restore product quantities
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity } }
          );
        }
      }
      
      // Update order status
      order.status = status;
      await order.save();
      
      return res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };