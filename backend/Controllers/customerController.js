const customerService = require('../Services/customerService');
const Transaction = require("../Models/Misc/Transaction")
const addItemToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  const result = await customerService.addToCart(userId, productId, quantity);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

const deleteCartItem = async (req, res) => {
    const { userId, productId } = req.params;
  
    const result = await customerService.removeFromCart(userId, productId);
  
    if (result.success) {
      res.json({ message: result.message, cart: result.cart });
    } else {
      res.status(404).json({ message: result.message });
    }
};

const getCart = async (req, res) => {
    const { userId } = req.params;
  
    const result = await customerService.getCart(userId);
  
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  };

  const updateCartItemQuantityController = async (req, res) => {
    const { userId, productId } = req.params;
    const { quantityChange } = req.body;

    // Validate quantityChange
    if (quantityChange === undefined || typeof quantityChange !== 'number' || !Number.isInteger(quantityChange) || quantityChange === 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantityChange provided. Must be a non-zero integer.' });
    }

    try {
        const result = await customerService.updateCartItemQuantity(userId, productId, quantityChange);

        if (result.success) {
            res.status(200).json(result);
        } else {
            // Handle specific service errors
            if (result.message === 'Customer not found' || result.message === 'Product not found in cart') {
                 res.status(404).json(result);
            } else if (result.message.startsWith('Cannot decrease quantity below 1')) {
                 res.status(400).json(result); // Bad request if trying to decrease below 1 explicitly
            }
            else {
                res.status(500).json(result); // Catch any other unexpected service errors
            }
        }
    } catch (error) {
        console.error('Server error in updateCartItemQuantityController:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while updating cart item quantity'
        });
    }
};

const getTopSellingDeliveredProductsLast30Days = async (limit = 10) => {
  try {
      // Input validation
      if (!Number.isInteger(limit) || limit < 1) {
          return { success: false, message: 'Invalid limit provided.' };
      }

      // Calculate the date 30 days ago from today.
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);

      // Aggregate transactions to count events for each product.
      const aggregationResult = await Transaction.aggregate([
          {
              // Filter transactions by date range and eventId.
              $match: {
                  timestamp: {
                      $gte: startDate,
                      $lte: endDate
                  },
                  eventId: 'order_delivered' // Filter for only 'order_delivered' events
              }
          },
          {
              // Group by product, counting occurrences.
              $group: {
                  _id: "$product",
                  count: { $sum: 1 },
                  firstTimestamp: { $min: "$timestamp" },
                  lastTimestamp: { $max: "$timestamp" }
              }
          },
          {
              // Sort by count in descending order.
              $sort: { count: -1 }
          },
          {
              // Limit the number of results.
              $limit: limit
          },
          {
              // Lookup product details (optional).
              $lookup: {
                  from: "products",
                  localField: "_id",
                  foreignField: "_id",
                  as: "productDetails"
              }
          },
          {
              // Project the results into a more readable format.
              $project: {
                  _id: 0,
                  productId: "$_id",
                  deliveryCount: "$count",
                  firstDeliveryDate: "$firstTimestamp",
                  lastDeliveryDate: "$lastTimestamp",
                  productDetails: { $arrayElemAt: ["$productDetails", 0] }
              }
          }
      ]);

      if (!aggregationResult || aggregationResult.length === 0) {
          return { success: true, message: 'No delivered orders found for the specified period.', topProducts: [] };
      }

      return {
          success: true,
          message: 'Top selling delivered products retrieved successfully.',
          topProducts: aggregationResult
      };
  } catch (error) {
      console.error('Error in getTopSellingDeliveredProductsLast30Days:', error);
      return {
          success: false,
          message: 'An error occurred while retrieving top selling products.',
          error: error.message
      };
  }
};

module.exports = {
    addItemToCart,
    deleteCartItem,
    getCart,
    updateCartItemQuantityController,
    getTopSellingDeliveredProductsLast30Days
};
