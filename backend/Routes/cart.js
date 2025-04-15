const express = require("express");
const router = express.Router();
const {addItemToCart, deleteCartItem, getCart} = require("../Controllers/customerController");

/**
 * Route: POST /add
 * Functionality: Adds a product to a user's cart.
 * Parameters (Body):
 *   - userId (number): The ID of the user.
 *   - productId (number): The ID of the product to add.
 *   - quantity (number): The quantity of the product to add.
 * Return Value:
 *   - 201 status with JSON message confirming addition to cart.
 */
router.post("/add", addItemToCart);

/**
 * Route: GET /:userId
 * Functionality: Retrieves all cart items belonging to a specific user.
 * Parameters (Route):
 *   - userId (number): The ID of the user whose cart is being retrieved.
 * Return Value:
 *   - JSON array containing all cart items for the given userId.
 */
router.get("/:userId", getCart);

/**
 * Route: DELETE /:userId/:productId
 * Functionality: Removes a specific product from a user's cart.
 * Parameters (Route):
 *   - userId (number): The ID of the user.
 *   - productId (number): The ID of the product to remove.
 * Return Value:
 *   - On success: JSON message confirming deletion.
 *   - On failure: 404 status with JSON message indicating item not found.
 */

router.delete('/:userId/:productId', deleteCartItem);

module.exports = router;
