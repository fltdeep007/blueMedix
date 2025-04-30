const customerService = require('../Services/customerService');
const Transaction = require("../Models/Misc/Transaction")
const Order = require("../Models/Products/Order")


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

const clearShoppingCart = async (req, res) => {
  const { userId } = req.params;
  const result = await customerService.clearCart(userId);
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
        // Unwind the products array to work with individual products
        $unwind: "$products"
      },
      {
        // Group by product, counting occurrences.
        $group: {
          _id: "$products.productId", // Group by the productId within the products array
          count: { $sum: "$products.quantity" }, // Sum the quantity of each product
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
          from: "products", // The collection to lookup from
          localField: "_id",  // The field from the current document ('_id' after the $group)
          foreignField: "_id", // The field from the 'products' collection
          as: "productDetails" // The name of the new array field
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
          productDetails: { $arrayElemAt: ["$productDetails", 0] } // Get the first element of the productDetails array.
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

const getOrderEventCountsLast24Hours = async () => {
  try {
    // Calculate the date range for the last 24 hours.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of the current day
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1); // End of the current day

    // Aggregate transactions to count each event type within the 24-hour window
    const aggregationResult = await Transaction.aggregate([
      {
        $match: {
          timestamp: {
            $gte: startOfDay,
            $lt: endOfDay, // Use $lt (less than) for exclusive upper bound
          },
          eventId: {
            $in: [
              "order_placed",
              "order_dispatched",
              "order_delivered",
              "order_accepted",
              "order_cancelled",
              "order_rejected",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$eventId",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          eventId: "$_id", // Rename _id to eventId
          count: 1,
        },
      },
    ]);

    // Convert the aggregation result into a more convenient object format.
    const eventCounts = {};
    aggregationResult.forEach((item) => {
      eventCounts[item.eventId] = item.count;
    });

    // Ensure all event types are present in the result, even if the count is 0.
    const allEventTypes = [
      "order_placed",
      "order_dispatched",
      "order_delivered",
      "order_accepted",
      "order_cancelled",
      "order_rejected",
    ];
    allEventTypes.forEach((eventType) => {
      if (!eventCounts[eventType]) {
        eventCounts[eventType] = 0;
      }
    });

    return {
      success: true,
      message: "Order event counts for the last 24 hours retrieved successfully.",
      eventCounts,
    };
  } catch (error) {
    console.error("Error in getOrderEventCountsLast24Hours:", error);
    return {
      success: false,
      message: "An error occurred while retrieving order event counts.",
      error: error.message,
    };
  }
};

const getLast10Orders = async () => {
  try {
    // Fetch the last 10 orders from the Order schema
    const orders = await Order.find()
      .sort({ createdAt: -1 }) // Sort by creation date in descending order to get the latest orders
      .limit(10)
      .populate('customer', '_id') // Populate the customer field, selecting only the _id
      .populate('seller', '_id') // Populate the seller field, selecting only the _id
      .populate('items.product'); // Populate the product details within the items array

    if (!orders || orders.length === 0) {
      return { success: true, message: "No orders found.", orders: [] };
    }

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      customer: order.customer,
      seller: order.seller,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity, // Assuming quantity is in your item schema
        price: item.price       //Assuming price is in your item schema
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      status: order.status,
      prescription_image: order.prescription_image,
      payment_method: order.payment_method,
      upi_id: order.upi_id,
      payment_status: order.payment_status,
      tracking: order.tracking,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return {
      success: true,
      message: "Last 10 orders retrieved successfully.",
      orders: formattedOrders,
    };
  } catch (error) {
    console.error("Error in getLast10Orders:", error);
    return {
      success: false,
      message: "An error occurred while retrieving the last 10 orders.",
      error: error.message,
    };
  }
};


const getOrderEventCountsLast7Days = async () => {
  try {
    // Calculate the date range for the last 7 days.
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    // Aggregate transactions to count each event type within the 7-day window
    const aggregationResult = await Transaction.aggregate([
      {
        $match: {
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
          eventId: {
            $in: [
              "order_placed",
              "order_dispatched",
              "order_delivered",
              "order_accepted",
              "order_cancelled",
              "order_rejected",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$eventId",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          eventId: "$_id", // Rename _id to eventId
          count: 1,
        },
      },
    ]);

    // Convert the aggregation result into a more convenient object format.
    const eventCounts = {};
    aggregationResult.forEach((item) => {
      eventCounts[item.eventId] = item.count;
    });

    // Ensure all event types are present in the result, even if the count is 0.
    const allEventTypes = [
      "order_placed",
      "order_dispatched",
      "order_delivered",
      "order_accepted",
      "order_cancelled",
      "order_rejected",
    ];
    allEventTypes.forEach((eventType) => {
      if (!eventCounts[eventType]) {
        eventCounts[eventType] = 0;
      }
    });

    return {
      success: true,
      message: "Order event counts for the last 7 days retrieved successfully.",
      eventCounts,
    };
  } catch (error) {
    console.error("Error in getOrderEventCountsLast7Days:", error);
    return {
      success: false,
      message: "An error occurred while retrieving order event counts.",
      error: error.message,
    };
  }
};

// const getOrderEventDetailsLast7Days = async () => {
//   try {
//     // Calculate the date range for the last 7 days.
//     const endDate = new Date();
//     const startDate = new Date(endDate);
//     startDate.setDate(endDate.getDate() - 7);

//     // Aggregate transactions to get details of each event
//     const aggregationResult = await Transaction.aggregate([
//       {
//         $match: {
//           timestamp: {
//             $gte: startDate,
//             $lte: endDate
//           },
//           eventId: {
//             $in: [
//                 "order_placed",
//                 "order_dispatched",
//                 "order_delivered",
//                 "order_accepted",
//                 "order_cancelled",
//                 "order_rejected"
//             ]
//           }
//         }
//       },
//       {
//         $sort: { timestamp: -1 } // Sort by timestamp in descending order
//       },
//       {
//         $project: {
//           _id: 0,
//           eventId: 1,
//           timestamp: 1,
//           orderId: "$order", // Assuming your transaction has 'order' field
//           // Add any other relevant fields you want to include
//         }
//       }
//     ]);
//     if (!aggregationResult || aggregationResult.length === 0) {
//         return { success: true, message: 'No order events found for the specified period.', orderEvents: [] };
//     }

//     return {
//       success: true,
//       message: "Order event details for the last 7 days retrieved successfully.",
//       orderEvents: aggregationResult,
//     };
//   } catch (error) {
//     console.error("Error in getOrderEventDetailsLast7Days:", error);
//     return {
//       success: false,
//       message: "An error occurred while retrieving order event details.",
//       error: error.message,
//     };
//   }
// };




module.exports = {
    addItemToCart,
    deleteCartItem,
    getCart,
    updateCartItemQuantityController,
    getTopSellingDeliveredProductsLast30Days,
    getOrderEventCountsLast24Hours,
    getOrderEventCountsLast7Days,
    getLast10Orders,
    clearShoppingCart
};
