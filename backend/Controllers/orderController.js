const orderService = require('../Services/orderService');

// Place an order - finds seller with matching pincode
const placeOrder = async (req, res) => {
  try {
    console.log("Request body:", JSON.stringify(req.body)); // Debug log
    const { 
        userId, 
        products, 
        prescription_image, 
        payment_method,
        upi_id 
      } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Products array is required and must not be empty" });
      }
      
      // Validate each product has required fields
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.productId) {
          return res.status(400).json({ 
            message: `Missing productId in product at index ${i}`,
            receivedProduct: product
          });
        }
        if (!product.quantity || isNaN(product.quantity) || product.quantity <= 0) {
          return res.status(400).json({ 
            message: `Invalid quantity for product at index ${i}`,
            receivedProduct: product
          });
        }
      }
    
    const result = await orderService.createOrderFromCartWithPincodeMatching(
        userId, 
        products, 
        prescription_image, 
        payment_method,
        upi_id 
    );
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error while placing order", 
      error: error.message 
    });
  }
};

// Update order status - seller can change order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const result = await orderService.updateOrderStatus(orderId, status);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message, orderId });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error updating order status", 
      error: error.message 
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await orderService.getOrderById(orderId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error fetching order", 
      error: error.message 
    });
  }
};

// Get orders by customer ID
const getOrdersByCustomerId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await orderService.getOrdersByCustomerId(userId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error fetching customer orders", 
      error: error.message 
    });
  }
};

// Get order tracking status
const getOrderTrackingStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await orderService.trackOrder(orderId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error tracking order", 
      error: error.message 
    });
  }
};

// Get orders by seller ID (with optional status filter)
const getOrdersBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.query; // Allow filtering by status
    
    const result = await orderService.getOrdersBySellerId(sellerId, status);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error fetching seller orders", 
      error: error.message 
    });
  }
};

// Get all orders (admin)
const getOrders = async (req, res) => {
  try {
    const result = await orderService.getOrders();
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error fetching all orders", 
      error: error.message 
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    
    const result = await orderService.cancelOrder(orderId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error cancelling order", 
      error: error.message 
    });
  }
};
// Get specific order by seller ID and order ID
const getSellerOrderById = async (req, res) => {
  try {
    const { sellerId, orderId } = req.params;
    
    // Check if both IDs are provided
    if (!sellerId || !orderId) {
      return res.status(400).json({ 
        success: false,
        message: "Both seller ID and order ID are required" 
      });
    }
    
    const result = await orderService.getSellerOrderById(sellerId, orderId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Server error fetching order details", 
      error: error.message 
    });
  }
};

module.exports = {
  placeOrder,
  updateOrderStatus,
  getOrderById,
  getOrdersByCustomerId,
  getOrderTrackingStatus,
  getOrdersBySellerId,
  getOrders,
  cancelOrder,
  getSellerOrderById
};