const express = require("express");
const router = express.Router();
const {addItemToCart, deleteCartItem, getCart , updateCartItemQuantityController} = require("../Controllers/customerController");
const { validationResult } = require('express-validator');
const { getTopSellingProducts } = require('../Controllers/transactionController');

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
/**
 * Route: PUT /:userId/:productId
 * Functionality: Updates the quantity of a specific product in a user's cart.
 * Parameters (Route):
 * - userId (number): The ID of the user.
 * - productId (number): The ID of the product to update.
 * Parameters (Body):
 * - quantityChange (number): The amount to change the quantity by (positive for increase, negative for decrease).
 * Return Value:
 * - On success: 200 status with JSON message and updated cart (or details of removed item if quantity goes to 0).
 * - On failure: 400 status for bad request (invalid quantityChange), 404 for customer or item not found, 500 for server error.
 */
router.put('/:userId/:productId', updateCartItemQuantityController);

router.get('/top/top-products', 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { year, month, limit = 5 } = req.query;
      
      // If year and month are not provided, use current month
      const currentDate = new Date();
      const parsedYear = year ? parseInt(year) : currentDate.getFullYear();
      const parsedMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // +1 because getMonth() is 0-indexed
      const parsedLimit = parseInt(limit);

      const result = await getTopSellingProducts(parsedYear, parsedMonth, parsedLimit);
      
      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Server error in top products route:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error occurred while fetching top products' 
      });
    }
  }
);

module.exports = router;
