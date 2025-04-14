const Product = require('../Models/Products/Product');
const Transaction = require('../Models/Misc/Transaction');
const mongoose = require('mongoose');

exports.listProducts = async (req, res) => {
    try {
      const { category, minPrice, maxPrice, sortBy, limit = 10, page = 1 } = req.query;
      
      // Build query
      const query = {};
      
      // Filter by category if provided
      if (category) {
        query.category = category;
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

exports.getProductDetails = async (req, res) => {
    try {
      const productId = req.params.productId;
      
      const product = await Product.findById(productId)
        .populate('category', 'name description')
        .populate('seller', 'name');
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      
      return res.status(200).json({ success: true, product });
    } catch (error) {
      console.error('Error in getProductDetails:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  // Get top selling products (last 30 days)
exports.getTopSellingProducts = async (req, res) => {
    try {
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Aggregate from transactions to find top selling products
      const topProducts = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: thirtyDaysAgo }
          }
        },
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
          $group: {
            _id: '$orderDetails.items.product',
            totalQuantity: { $sum: '$orderDetails.items.quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]);
      
      // Fetch actual product details
      const productIds = topProducts.map(item => item._id);
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category', 'name')
        .populate('seller', 'name');
      
      // Map quantity data to products
      const result = products.map(product => {
        const quantityData = topProducts.find(item => item._id.toString() === product._id.toString());
        return {
          ...product._doc,
          totalSold: quantityData ? quantityData.totalQuantity : 0
        };
      });
      
      // Sort by the original quantity order
      result.sort((a, b) => b.totalSold - a.totalSold);
      
      return res.status(200).json({ success: true, products: result });
    } catch (error) {
      console.error('Error in getTopSellingProducts:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  // Get popular products (randomly selected, excluding top selling)
exports.getPopularProducts = async (req, res) => {
    try {
      // First get top selling product IDs to exclude them
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const topProducts = await Transaction.aggregate([
        {
          $match: {
            created_at: { $gte: thirtyDaysAgo }
          }
        },
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
          $group: {
            _id: '$orderDetails.items.product',
            totalQuantity: { $sum: '$orderDetails.items.quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]);
      
      const topProductIds = topProducts.map(item => item._id);
      
      // Get random products excluding top selling ones
      const popularProducts = await Product.aggregate([
        { $match: { _id: { $nin: topProductIds } } },
        { $sample: { size: 10 } }
      ]);
      
      // Populate category and seller info
      const populatedProducts = await Product.populate(popularProducts, [
        { path: 'category', select: 'name' },
        { path: 'seller', select: 'name' }
      ]);
      
      return res.status(200).json({ success: true, products: populatedProducts });
    } catch (error) {
      console.error('Error in getPopularProducts:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };