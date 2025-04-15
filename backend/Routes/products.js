const express = require("express");
const fs = require("fs");
const router = express.Router();
const { getAllProducts, getProductById, addProduct, deleteProduct, updateProduct, getProductByCategory } = require("../Controllers/productController"); 

/**
 * Route: GET /
 * Functionality: Retrieves the list of all products.
 * Parameters: None
 * Return Value:
 *   - JSON array containing all the products.
 */
router.get("/", getAllProducts); // Return all products

/**
 * Route: GET /:id
 * Functionality: Retrieves details of a specific product by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the product to be fetched.
 * Return Value:
 *   - JSON object containing the details of the product.
 *   - If the product is not found, returns 404 with a "Not found" message.
 */
router.get("/:productId", getProductById); 

/**
 * Route: POST /create
 * Functionality: Creates a new product and saves it to the products database.
 * Parameters (Body):
 *   - The product object (e.g., contains `name`, `price`, `description`, etc.).
 * Return Value:
 *   - 201 status with a JSON message confirming the product creation.
 */
router.post("/create", addProduct); // Create a new product

/**
 * Route: PUT /update/:id
 * Functionality: Updates the details of an existing product by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the product to be updated.
 * Parameters (Body):
 *   - Product object containing the new details of the product (e.g., updated `name`, `price`, etc.).
 * Return Value:
 *   - JSON message confirming the product update.
 *   - If the product is not found, returns 404 with an error message.
 */
router.put("/:productId", updateProduct); 

/**
 * Route: DELETE /delete/:id
 * Functionality: Deletes an existing product by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the product to be deleted.
 * Return Value:
 *   - JSON message confirming the deletion.
 *   - If the product is not found, returns 404 with an error message.
 */
router.delete("/delete/:productId", deleteProduct); // Delete a product


router.get("/category/:categoryId", getProductByCategory); // Get products by category
/**
 * Route: POST /import
 * Functionality: Simulates importing products (not implemented).
 * Parameters (Body): None
 * Return Value:
 *   - JSON message indicating that import functionality is not implemented in this demo.
 */
router.post("/import", (req, res) => {
  res.json({ message: "Import not implemented in demo" }); // Simulated response
});

module.exports = router;

