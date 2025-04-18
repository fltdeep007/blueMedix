const Order = require('../Models/Products/Order');
const User = require('../Models/User/User');
const Seller = require('../Models/User/Roles/Seller');
const Product = require('../Models/Products/Product');
const Transaction = require('../Models/Misc/Transaction')

/**
 * Create order with pincode matching logic (no cart dependency)
 */
const createOrderFromCartWithPincodeMatching = async (userId, products, prescription_image, payment_method, upi_id = null) => {
  try {
    // Get the customer details to access their pincode
    const customer = await User.findById(userId).lean();
    if (!customer) {
      return { success: false, message: "Customer not found" };
    }
    
    // Get customer's pincode
    const customerPincode = customer.address.pin_code;
        
    // Find sellers with matching pincode
    const availableSellers = await Seller.find({
      'address.pin_code': customerPincode,
      'verification_status': 'approved',
      'is_verified': true
    }).lean();
        
    if (availableSellers.length === 0) {
      return {
        success: false,
        message: "No verified sellers available in your pincode area"
      };
    }
        
    // Get an available seller (for now, just take the first one)
    const sellerId = availableSellers[0]._id;
        
    // Validate products array
    if (!products || !Array.isArray(products) || products.length === 0) {
      return { success: false, message: "No products provided for order" };
    }
        
    console.log("Products received:", JSON.stringify(products)); // Debug log
        
    // Validate products and get their details
    const orderItems = [];
    let totalPrice = 0;
        
    for (const item of products) {
      // Check if productId exists
      if (!item.productId) {
        return {
          success: false,
          message: "Product ID is missing in one of the products"
        };
      }
            
      console.log(`Looking up product with ID: ${item.productId}`); // Debug log
            
      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          message: `Product with ID ${item.productId} not found`
        };
      }
            
      // Handle Decimal128 properly
      const productPrice = parseFloat(product.price.toString());
      const itemPrice = productPrice * item.quantity;
      totalPrice += itemPrice;
            
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: productPrice
      });
    }
        
    // Create new order
    const newOrder = new Order({
      customer: userId,
      seller: sellerId,
      items: orderItems,
      totalAmount: totalPrice,
      shippingAddress: {
        first_line: customer.address.first_line,
        second_line: customer.address.second_line,
        city: customer.address.city,
        state: customer.address.state,
        pin_code: customer.address.pin_code
      },
      status: 'pending',
      prescription_image: prescription_image,
      payment_method: payment_method,
      payment_status: payment_method === 'cod' ? 'pending' : 'paid', // Mark UPI payments as paid
      upi_id: payment_method === 'upi' ? upi_id : null,
      tracking: [{
        status: 'pending',
        timestamp: new Date(),
        description: 'Order placed successfully'
      }]
    });
        
    const savedOrder = await newOrder.save();
    
    await Seller.findByIdAndUpdate(
      sellerId,
      { $push: { orders: savedOrder._id } },
      { new: true }
    );
    
    // Create transaction records for each product in the order
    const transactionPromises = orderItems.map(item => {
      const transaction = new Transaction({
        order: savedOrder._id,
        product: item.product,
        quantity: item.quantity,
        eventId: 'order_placed',
        timestamp: new Date()
      });
      return transaction.save();
    });
    
    await Promise.all(transactionPromises);
           
    return {
      success: true,
      message: "Order placed successfully",
      order: savedOrder,
      seller: {
        name: availableSellers[0].name,
        email: availableSellers[0].e_mail,
        phone: availableSellers[0].phone_no
      }
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      message: "Failed to create order",
      error: error.message
    };
  }
};
/**
 * Get orders by seller ID with optional status filtering
 */
const getOrdersBySellerId = async (sellerId, status = null) => {
  try {
    // First, find the seller and populate their orders
    const seller = await Seller.findById(sellerId)
      .populate({
        path: 'orders',
        populate: [
          { path: 'customer', select: 'name e_mail phone_no' },
          { path: 'items.product' }
        ]
      });
    
    if (!seller) {
      return {
        success: false,
        message: "Seller not found"
      };
    }
    
    // Filter orders by status if provided
    let orders = seller.orders;
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    // Sort by createdAt descending
    orders.sort((a, b) => b.createdAt - a.createdAt);
    
    return {
      success: true,
      orders: orders.length > 0 ? orders : []
    };
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return {
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    };
  }
};
/**
 * Update order status and add to tracking history
 */
const updateOrderStatus = async (orderId, status) => {
  try {
    // Valid status transitions
    const validStatuses = ['pending', 'accepted', 'dispatched', 'delivered', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return {
        success: false,
        message: "Order not found"
      };
    }
    
    // Update order status
    order.status = status;
    
    // Add tracking entry
    let description;
    switch (status) {
      case 'accepted':
        description = 'Order accepted by seller';
        break;
      case 'dispatched':
        description = 'Order has been dispatched';
        break;
      case 'delivered':
        description = 'Order has been delivered successfully';
        break;
      case 'rejected':
        description = 'Order has been rejected by seller';
        break;
      default:
        description = `Order status updated to ${status}`;
    }
    
    order.tracking.push({
      status,
      timestamp: new Date(),
      description
    });
    
    await order.save();
    
    return {
      success: true,
      message: `Order status updated to ${status}`,
      order
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message: "Failed to update order status",
      error: error.message
    };
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('customer', 'name e_mail phone_no')
      .populate('seller', 'name e_mail phone_no')
      .populate('items.product');
    
    if (!order) {
      return {
        success: false,
        message: "Order not found"
      };
    }
    
    return {
      success: true,
      order
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      message: "Failed to fetch order",
      error: error.message
    };
  }
};

/**
 * Get orders by customer ID
 */
const getOrdersByCustomerId = async (userId) => {
  try {
    const orders = await Order.find({ customer: userId })
      .populate('seller', 'name e_mail phone_no')
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return {
        success: true,
        message: "No orders found",
        orders: []
      };
    }
    
    return {
      success: true,
      orders
    };
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return {
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    };
  }
};

/**
 * Get all orders (for admin)
 */
const getOrders = async () => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name e_mail phone_no')
      .populate('seller', 'name e_mail phone_no')
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    return {
      success: true,
      orders
    };
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return {
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    };
  }
};

/**
 * Track order status
 */
const trackOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .select('tracking status createdAt');
    
    if (!order) {
      return {
        success: false,
        message: "Order not found"
      };
    }
    
    return {
      success: true,
      tracking: order.tracking,
      currentStatus: order.status,
      orderDate: order.createdAt
    };
  } catch (error) {
    console.error("Error tracking order:", error);
    return {
      success: false,
      message: "Failed to track order",
      error: error.message
    };
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      return {
        success: false,
        message: "Order not found"
      };
    }
    
    // Only allow cancellation if order is in 'pending' or 'accepted' status
    if (order.status !== 'pending' && order.status !== 'accepted') {
      return {
        success: false,
        message: `Cannot cancel order in '${order.status}' status. Can only be cancelled when order isn't dispatched`
      };
    }
    
    order.status = 'cancelled';
    order.tracking.push({
      status: 'cancelled',
      timestamp: new Date(),
      description: 'Order has been cancelled'
    });
    
    await order.save();
    
    return {
      success: true,
      message: "Order cancelled successfully",
      order
    };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return {
      success: false,
      message: "Failed to cancel order",
      error: error.message
    };
  }
};

const getTopSellingProductsInMonth = async (year, month) => {
  try {
    // Create date range for the specified month
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date
    const endDate = new Date(year, month, 0); // Last day of the month
    
    // Aggregate to find top selling products
    const topProducts = await Transaction.aggregate([
      // Match transactions within the date range and only order_placed events
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventId: 'order_placed'
        }
      },
      // Group by product and sum quantities
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' }
        }
      },
      // Sort by total quantity in descending order
      {
        $sort: { totalQuantity: -1 }
      },
      // Limit to top 5
      {
        $limit: 5
      },
      // Lookup product details
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      // Unwind the product details array
      {
        $unwind: '$productDetails'
      },
      // Project only needed fields
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$productDetails.name',
          totalQuantity: 1,
          totalRevenue: { $multiply: ['$totalQuantity', { $toDouble: '$productDetails.price' }] }
        }
      }
    ]);
    
    return {
      success: true,
      month: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      year: year,
      products: topProducts
    };
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return {
      success: false,
      message: "Failed to fetch top selling products",
      error: error.message
    };
  }
}; 

const getSellerOrderById = async (sellerId, orderId) => {
  try {
    // Check if seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return {
        success: false,
        message: "Seller not found"
      };
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name image price description category')
      // .populate('seller', 'name email phone address')
      // .populate('transaction');

    // If no order found
    if (!order) {
      return {
        success: false,
        message: "Order not found"
      };
    }

    // Verify that the order belongs to this seller
    if (order.seller._id.toString() !== sellerId) {
      return {
        success: false,
        message: "Order does not belong to this seller"
      };
    }

    return {
      success: true,
      data: order
    };
  } catch (error) {
    console.error("Error in getSellerOrderById:", error);
    return {
      success: false,
      message: "Error fetching order details",
      error: error.message
    };
  }
};

module.exports = {
  createOrderFromCartWithPincodeMatching,
  updateOrderStatus,
  getOrderById,
  getOrdersByCustomerId,
  getOrdersBySellerId,
  getOrders,
  trackOrder,
  cancelOrder,
  getTopSellingProductsInMonth,
  getSellerOrderById
};