// controllers/regionalAdminController.js
const Seller = require('../Models/User/Roles/Seller');
const RegionalAdmin = require('../Models/User/Roles/RegionalAdmin');
const Order = require('../Models/Products/Order');

// Get seller list in region
exports.getSellerList = async (req, res) => {
  try {
    const { status = 'approved' } = req.query;
    
    // Validate status
    if (!['approved', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be either "approved" or "pending"' 
      });
    }
    
    // Get regional admin's region
    const admin = await RegionalAdmin.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Regional admin not found' });
    }
    
    // Build query
    const query = { 
      region: admin.region,
      approval_status: status
    };
    
    // Get sellers in region
    const sellers = await Seller.find(query)
      .select('name e_mail phone_no address created_at');
    
    return res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    console.error('Error in getSellerList:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update seller (approve/decline)
exports.updateSeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const { approval_status } = req.body;
    
    if (!approval_status) {
      return res.status(400).json({ success: false, message: 'Approval status is required' });
    }
    
    // Validate approval status
    if (!['approved', 'declined'].includes(approval_status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid approval status. Must be either "approved" or "declined"' 
      });
    }
    
    // Get regional admin's region
    const admin = await RegionalAdmin.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Regional admin not found' });
    }
    
    // Find the seller
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    // Check if seller is in admin's region
    if (seller.region !== admin.region) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update seller outside your region' 
      });
    }
    
    // Update seller's approval status
    seller.approval_status = approval_status;
    await seller.save();
    
    return res.status(200).json({
      success: true,
      message: `Seller ${approval_status} successfully`,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.e_mail,
        approval_status: seller.approval_status
      }
    });
  } catch (error) {
    console.error('Error in updateSeller:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Track orders in region
exports.trackOrders = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    // Get regional admin's region
    const admin = await RegionalAdmin.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Regional admin not found' });
    }
    
    // Build query to find sellers in admin's region
    const sellerQuery = { region: admin.region };
    
    // Get all sellers in region
    const sellers = await Seller.find(sellerQuery).select('_id');
    const sellerIds = sellers.map(seller => seller._id);
    
    // Build order query
    const orderQuery = { seller: { $in: sellerIds } };
    
    // Filter by status if provided
    if (status) {
      orderQuery.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const orders = await Order.find(orderQuery)
      .populate('customer', 'name e_mail phone_no')
      .populate('seller', 'name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(orderQuery);
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / parseInt(limit)),
      currentPage: parseInt(page),
      region: admin.region,
      orders
    });
  } catch (error) {
    console.error('Error in trackOrders:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Track specific order in region
exports.trackOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Get regional admin's region
    const admin = await RegionalAdmin.findById(req.user._id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Regional admin not found' });
    }
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('customer', 'name e_mail phone_no address')
      .populate('seller', 'name e_mail phone_no')
      .populate('items.product', 'name price image_link');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Get seller details
    const seller = await Seller.findById(order.seller);
    
    // Check if order is in admin's region
    if (seller.region !== admin.region) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to view order outside your region' 
      });
    }
    
    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error in trackOrder:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};