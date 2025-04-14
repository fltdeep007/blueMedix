// controllers/adminController.js
const Product = require('../Models/Products/Product');
const Seller = require('../Models/User/Roles/Seller');
const Customer = require('../Models/User/Roles/Customer');
const RegionalAdmin = require('../Models/User/Roles/RegionalAdmin');
const Transaction = require('../Models/Misc/Transaction');
const Order = require('../Models/Products/Order');
const Category = require('../Models/Products/Category');
const mongoose = require('mongoose');

// List all products (admin)
exports.listProducts = async (req, res) => {
  try {
    const { 
      category, seller, minPrice, maxPrice, 
      sortBy, limit = 20, page = 1 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter by seller if provided
    if (seller) {
      query.seller = seller;
    }
    
    // Filter by price range if provided
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = mongoose.Types.Decimal128.fromString(minPrice.toString());
      if (maxPrice) query.price.$lte = mongoose.Types.Decimal128.fromString(maxPrice.toString());
    }
    
    // Determine sort order
    let sort = {};
    if (sortBy === 'price_asc') sort.price = 1;
    else if (sortBy === 'price_desc') sort.price = -1;
    else if (sortBy === 'newest') sort.created_at = -1;
    else if (sortBy === 'oldest') sort.created_at = 1;
    else sort.created_at = -1; // Default sort by newest
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('seller', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      currentPage: parseInt(page),
      products
    });
  } catch (error) {
    console.error('Error in listProducts:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add product
exports.addProduct = async (req, res) => {
  try {
    const { 
      name, price, description, image_link, 
      discount, quantity, category, seller 
    } = req.body;
    
    // Validate required fields
    if (!name || !price || !description || !image_link || !quantity || !category || !seller) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if seller exists
    const sellerExists = await Seller.findById(seller);
    if (!sellerExists) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    // Create new product
    const newProduct = new Product({
      name,
      price: mongoose.Types.Decimal128.fromString(price.toString()),
      description,
      image_link,
      discount: discount || 0,
      quantity,
      category,
      seller
    });
    
    const savedProduct = await newProduct.save();
    
    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error in addProduct:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Edit product
exports.editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updateData = req.body;
    
    // Convert price to Decimal128 if it exists in update data
    if (updateData.price) {
      updateData.price = mongoose.Types.Decimal128.fromString(updateData.price.toString());
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name')
     .populate('seller', 'name');
    
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error in editProduct:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Bulk import products
exports.bulkImportProducts = async (req, res) => {
  try {
    const products = req.body.products;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Products must be a non-empty array' 
      });
    }
    
    // Validate and prepare products for import
    const validProducts = [];
    const errors = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Check for required fields
      if (!product.name || !product.price || !product.description || 
          !product.image_link || !product.quantity || !product.category || !product.seller) {
        errors.push(`Product at index ${i}: Missing required fields`);
        continue;
      }
      
      // Check if category exists
      const categoryExists = await Category.findById(product.category);
      if (!categoryExists) {
        errors.push(`Product at index ${i}: Category not found`);
        continue;
      }
      
      // Check if seller exists
      const sellerExists = await Seller.findById(product.seller);
      if (!sellerExists) {
        errors.push(`Product at index ${i}: Seller not found`);
        continue;
      }
      
      // Convert price to Decimal128
      product.price = mongoose.Types.Decimal128.fromString(product.price.toString());
      
      // Set default values if not provided
      product.discount = product.discount || 0;
      product.schema = 1;
      
      validProducts.push(product);
    }
    
    // If no valid products, return error
    if (validProducts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid products to import',
        errors
      });
    }
    
    // Insert valid products
    const insertedProducts = await Product.insertMany(validProducts);
    
    return res.status(201).json({
      success: true,
      message: `${insertedProducts.length} products imported successfully`,
      productsCount: insertedProducts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in bulkImportProducts:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List all sellers
exports.listSellers = async (req, res) => {
  try {
    const { region, status, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { role: 'Seller' };
    
    // Filter by region if provided
    if (region) {
      query.region = region;
    }
    
    // Filter by approval status if provided
    if (status) {
      query.approval_status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const sellers = await Seller.find(query)
      .select('name e_mail phone_no region approval_status created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalSellers = await Seller.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: sellers.length,
      total: totalSellers,
      totalPages: Math.ceil(totalSellers / parseInt(limit)),
      currentPage: parseInt(page),
      sellers
    });
  } catch (error) {
    console.error('Error in listSellers:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List all regional admins
exports.listRegionalAdmins = async (req, res) => {
  try {
    const { region, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { role: 'RegionalAdmin' };
    
    // Filter by region if provided
    if (region) {
      query.region = region;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const admins = await RegionalAdmin.find(query)
      .select('name e_mail phone_no region created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalAdmins = await RegionalAdmin.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: admins.length,
      total: totalAdmins,
      totalPages: Math.ceil(totalAdmins / parseInt(limit)),
      currentPage: parseInt(page),
      regionalAdmins: admins
    });
  } catch (error) {
    console.error('Error in listRegionalAdmins:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get regional admin list (with status filter)
exports.getRegionalAdminList = async (req, res) => {
  try {
    const { region, status = 'approved', limit = 20, page = 1 } = req.query;
    
    // Validate status
    if (!['approved', 'pending'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be either "approved" or "pending"' 
      });
    }
    
    // Build query
    const query = { 
      role: 'RegionalAdmin',
      approval_status: status
    };
    
    // Filter by region if provided
    if (region) {
      query.region = region;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const admins = await RegionalAdmin.find(query)
      .select('name e_mail phone_no region created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalAdmins = await RegionalAdmin.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: admins.length,
      total: totalAdmins,
      totalPages: Math.ceil(totalAdmins / parseInt(limit)),
      currentPage: parseInt(page),
      status,
      regionalAdmins: admins
    });
  } catch (error) {
    console.error('Error in getRegionalAdminList:', error);
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
    
    // Find the seller
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
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

// Find customer by name
exports.findCustomer = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    
    // Create regex for name search (case insensitive)
    const nameRegex = new RegExp(name, 'i');
    
    // Find customers by name
    const customers = await Customer.find({ 
      role: 'Customer',
      name: nameRegex 
    }).select('name e_mail phone_no address');
    
    return res.status(200).json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    console.error('Error in findCustomer:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get product-wise report
exports.getProductWiseReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    // Build date range filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Build initial match stage
    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.created_at = dateFilter;
    }
    
    // Product category filter (will be applied after lookup)
    let categoryFilter = {};
    if (category) {
      categoryFilter = { 'productDetails.category': mongoose.Types.ObjectId(category) };
    }
    
    // Aggregate transactions
    const report = await Transaction.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      { $unwind: '$orderDetails' },
      { $unwind: '$orderDetails.items' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderDetails.items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      { $match: categoryFilter },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$productDetails._id',
          productName: { $first: '$productDetails.name' },
          categoryName: { $first: '$categoryDetails.name' },
          totalSales: { $sum: '$orderDetails.items.quantity' },
          totalRevenue: { 
            $sum: { 
              $multiply: [
                { $toDouble: '$productDetails.price' },
                '$orderDetails.items.quantity',
                { $subtract: [1, { $divide: ['$productDetails.discount', 100] }] }
              ] 
            } 
          },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    // Get additional category information if category filter is applied
    let categoryInfo = null;
    if (category) {
      categoryInfo = await Category.findById(category).select('name description');
    }
    
    return res.status(200).json({
      success: true,
      count: report.length,
      categoryInfo,
      dateRange: {
        startDate: startDate || 'all time',
        endDate: endDate || 'present'
      },
      products: report
    });
  } catch (error) {
    console.error('Error in getProductWiseReport:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update regional admin
exports.updateRegionalAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
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
    
    // Find the regional admin
    const admin = await RegionalAdmin.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Regional admin not found' });
    }
    
    // Update regional admin's approval status
    admin.approval_status = approval_status;
    await admin.save();
    
    return res.status(200).json({
      success: true,
      message: `Regional admin ${approval_status} successfully`,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.e_mail,
        approval_status: admin.approval_status
      }
    });
  } catch (error) {
    console.error('Error in updateRegionalAdmin:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get sales report by region
exports.getSalesReportByRegion = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date range filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Build initial match stage
    const matchStage = {};
    if (Object.keys(dateFilter).length > 0) {
      matchStage.created_at = dateFilter;
    }
    
    // Aggregate transactions by region
    const report = await Transaction.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      { $unwind: '$orderDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'orderDetails.seller',
          foreignField: '_id',
          as: 'sellerDetails'
        }
      },
      { $unwind: '$sellerDetails' },
      {
        $group: {
          _id: '$sellerDetails.region',
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $reduce: {
                input: '$orderDetails.items',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    {
                      $multiply: [
                        { $toDouble: { $arrayElemAt: ['$productPrices', { $indexOfArray: ['$productIds', '$$this.product'] }] } },
                        '$$this.quantity'
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    return res.status(200).json({
      success: true,
      count: report.length,
      dateRange: {
        startDate: startDate || 'all time',
        endDate: endDate || 'present'
      },
      regions: report
    });
  } catch (error) {
    console.error('Error in getSalesReportByRegion:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    if (period === '7days') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(endDate.getDate() - 90);
    } else if (period === '1year') {
      startDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid period. Use 7days, 30days, 90days, or 1year' 
      });
    }
    
    // Count new customers
    const newCustomers = await Customer.countDocuments({
      role: 'Customer',
      created_at: { $gte: startDate, $lte: endDate }
    });
    
    // Count returning customers (customers who have placed more than one order)
    const returningCustomersData = await Order.aggregate([
      { $match: { created_at: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'count' }
    ]);
    
    const returningCustomers = returningCustomersData.length > 0 ? returningCustomersData[0].count : 0;
    
    // Get order demographics by gender
    const genderDemographics = await Order.aggregate([
      { $match: { created_at: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      { $unwind: '$customerDetails' },
      {
        $group: {
          _id: '$customerDetails.gender',
          count: { $sum: 1 },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    
    return res.status(200).json({
      success: true,
      period,
      dateRange: {
        startDate,
        endDate
      },
      analytics: {
        newCustomers,
        returningCustomers,
        genderDemographics
      }
    });
  } catch (error) {
    console.error('Error in getCustomerAnalytics:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};