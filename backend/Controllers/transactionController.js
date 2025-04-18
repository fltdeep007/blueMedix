// transactionController.js
const Transaction  = require('../Models/Misc/Transaction');
const Product = require('../Models/Products/Product');

/**
 * Get top selling products (defaults to current month)
 * @param {Number} year - Full year (e.g., 2025)
 * @param {Number} month - Month number (1-12)
 * @param {Number} limit - Number of top products to return (default: 5)
 * @returns {Object} - Object containing success status and top products data
 */
const getTopSellingProducts = async (year, month, limit = 5) => {
  try {
    // Create date range for the specified month
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date
    const endDate = new Date(year, month, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
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
          totalQuantity: { $sum: '$quantity' },
          orderCount: { $sum: 1 }
        }
      },
      // Sort by total quantity in descending order
      {
        $sort: { totalQuantity: -1 }
      },
      // Limit to specified number of products
      {
        $limit: limit
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
          image: '$productDetails.image',
          category: '$productDetails.category',
          totalQuantity: 1,
          orderCount: 1,
          totalRevenue: { $multiply: ['$totalQuantity', { $toDouble: '$productDetails.price' }] }
        }
      }
    ]);
    
    // Get current date information for response
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const isCurrentMonth = new Date().getMonth() + 1 === month && 
                           new Date().getFullYear() === year;
    
    return {
      success: true,
      data: {
        period: {
          month: monthName,
          year: year,
          isCurrentMonth
        },
        products: topProducts,
        totalItems: topProducts.length
      }
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

module.exports = {
  getTopSellingProducts
};