const express = require("express");
const fs = require("fs");
const router = express.Router();
const { placeOrder, updateOrderStatus, getOrderById, getOrderTrackingStatus, getOrdersByCustomerId, getOrdersBySellerId, getOrders, cancelOrder } = require("../Controllers/orderController");




/**
 * Route: POST /create
 * Functionality: Creates a new order and saves it to the orders database.
 * Parameters (Body):
 *   - The order object (e.g., contains `user_id`, `product_id`, `quantity`, `status`, etc.).
 * Return Value:
 *   - 201 status with a JSON message confirming the order placement.
 */
router.post("/create", placeOrder);

/**
 * Route: PUT /status/:id
 * Functionality: Updates the status of an existing order by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the order to be updated.
 * Parameters (Body):
 *   - new_status (string): The new status to be assigned to the order (e.g., "shipped", "delivered", etc.).
 * Return Value:
 *   - On success: JSON message confirming the status update.
 *   - On failure (e.g., invalid ID): 404 status with an error message.
 */
router.put("/status/:orderId", updateOrderStatus);

/**
 * Route: GET /
 * Functionality: Retrieves all orders from the database.
 * Return Value:
 *  - JSON array containing all orders.
 * - On failure: 404 status with an error message.
 */
router.get("/", getOrders);

/**
 * Route: GET /:id
 * Functionality: Retrieves details of a specific order by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the order to be fetched.
 * Return Value:
 *   - JSON object containing the details of the order.
 *   - On failure (e.g., invalid ID): 404 status with an error message.
 */
router.get("/:orderId", getOrderById);

/**
 * Route: GET /user/:userId
 * Functionality: Retrieves all orders placed by a specific user.
 * Parameters (Route):
 *   - userId (number): The ID of the user whose orders are to be retrieved.
 * Return Value:
 *   - JSON array containing all orders placed by the specified user.
 */
router.get("/user/:userId", getOrdersByCustomerId);

/**
 * Route: GET /seller/:sellerId
 * Functionality: Retrieves all orders placed with a specific seller.
 * Parameters (Route):  
 *  - sellerId (number): The ID of the seller whose orders are to be retrieved.
 * Return Value:
 *  - JSON array containing all orders placed with the specified seller.
 * */
router.get("/seller/:sellerId", getOrdersBySellerId);

/**
 * Route: GET /track/:id
 * Functionality: Retrieves the tracking status of an order by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the order to track.
 * Return Value:
 *   - JSON object containing the status of the order.
 *   - If the order is not found: JSON with "Not found" status.
 */
router.get("/track/:orderId", getOrderTrackingStatus);

/**
 * Route: POST /cancel/:id
 * Functionality: Cancels an order by updating its status to "cancelled".
 * Parameters (Route):
 *   - id (number): The ID of the order to be cancelled.
 * Return Value:
 *   - JSON message confirming the cancellation.
 */
router.put("/cancel/:id", cancelOrder);



module.exports = router;

