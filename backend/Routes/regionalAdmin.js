const express = require("express");
const router = express.Router();
const data = require("../db/data.json"); // Simulated in-memory database of sellers

/**
 * Route: GET /sellers
 * Functionality: Retrieves the list of sellers from a specific region.
 * Parameters (Query):
 *   - region (string): The region to filter sellers by.
 * Return Value:
 *   - JSON array of sellers from the specified region.
 */
router.get("/sellers", (req, res) => {
  const regionalSellers = data.sellers.filter(s => s.region === req.query.region); // Filter sellers by region
  res.json(regionalSellers); // Return filtered sellers
});

/**
 * Route: PUT /approve/:id
 * Functionality: Approves a seller by updating their status to "Approved".
 * Parameters (Route):
 *   - id (number): The ID of the seller to approve.
 * Return Value:
 *   - JSON message confirming the approval of the seller.
 *   - If the seller is not found, returns 404 with an error message.
 */
router.put("/approve/:id", (req, res) => {
  const seller = data.sellers.find(s => s.id === parseInt(req.params.id)); // Find seller by ID
  if (!seller) return res.status(404).json({ message: "Seller not found" }); // Seller not found

  seller.status = "Approved"; // Update seller's status
  res.json({ message: "Seller approved" }); // Return confirmation
});

/**
 * Route: PUT /reject/:id
 * Functionality: Rejects a seller by updating their status to "Rejected".
 * Parameters (Route):
 *   - id (number): The ID of the seller to reject.
 * Return Value:
 *   - JSON message confirming the rejection of the seller.
 *   - If the seller is not found, returns 404 with an error message.
 */
router.put("/reject/:id", (req, res) => {
  const seller = data.sellers.find(s => s.id === parseInt(req.params.id)); // Find seller by ID
  if (!seller) return res.status(404).json({ message: "Seller not found" }); // Seller not found

  seller.status = "Rejected"; // Update seller's status
  res.json({ message: "Seller rejected" }); // Return confirmation
});

module.exports = router;
