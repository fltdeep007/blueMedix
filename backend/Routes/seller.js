const express = require("express");
const router = express.Router();
const data = require("../db/data.json"); // Simulated in-memory database of sellers

const { getAllSellers, addNewSeller, getSeller} = require("../Controllers/sellerController");

/**
 * Route: POST /add
 * Functionality: Adds a new seller to the list.
 * Request Body:
 *   - seller (object): The new seller to be added to the database.
 * Return Value:
 *   - JSON message confirming the seller addition.
 *   - The added seller's data.
 */
router.post("/add", addNewSeller); 

/**
 * Route: GET /list
 * Functionality: Retrieves the list of all sellers.
 * Return Value:
 *   - JSON array of all sellers.
 */
router.get("/", getAllSellers); // Return all sellers

/**
 * Route: GET /:sellerId
 * Functionality: Retrieves a specific seller by ID.
 * Request Parameters:
 *   - sellerId (string): The ID of the seller to be retrieved.
 * Return Value:
 *   - JSON object of the specified seller.
 */
router.get("/:sellerId", getSeller); // Return a specific seller by ID

module.exports = router;
