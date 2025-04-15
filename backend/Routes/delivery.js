const express = require("express");
const router = express.Router();
const data = require("../db/data.json"); // Simulated in-memory database

/**
 * Route: POST /status
 * Functionality: Updates the delivery status of an existing order.
 * Parameters (Body):
 *   - orderId (number): The ID of the order to update.
 *   - status (string): The new delivery status of the order (e.g., "Shipped", "Delivered").
 * Return Value:
 *   - On success: JSON object with a message confirming the status update and the updated order.
 *   - On failure (e.g., order not found): 404 status with a message indicating the order was not found.
 */
router.post("/status", (req, res) => {
  const { orderId, status } = req.body;
  
  // Find the order by its ID
  const order = data.orders.find(o => o.id === parseInt(orderId));
  
  // If the order is not found, respond with a 404 error
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Update the order's status
  order.status = status;

  // Respond with a message confirming the status update
  res.json({ message: `Delivery status updated to ${status}`, order });
});

module.exports = router;
