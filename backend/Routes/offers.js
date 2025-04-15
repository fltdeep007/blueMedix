const express = require("express");
const router = express.Router();
const data = require("../db/data.json"); // Simulated in-memory database

/**
 * Route: GET /
 * Functionality: Retrieves all available offers.
 * Parameters: None
 * Return Value:
 *   - JSON array containing all available offers in the system.
 */
router.get("/", (req, res) => res.json(data.offers));

/**
 * Route: POST /create
 * Functionality: Creates a new offer and adds it to the list of offers.
 * Parameters (Body):
 *   - offer (object): The offer data to be created, including properties like `id`, `name`, `discount`, etc.
 * Return Value:
 *   - 201 status with a JSON message confirming offer creation and the newly created offer object.
 */
router.post("/create", (req, res) => {
  const offer = req.body;
  data.offers.push(offer); // Add the new offer to the list
  res.status(201).json({ message: "Offer created", offer }); // Respond with the created offer
});

/**
 * Route: PUT /update/:id
 * Functionality: Updates an existing offer by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the offer to be updated.
 * Parameters (Body):
 *   - Any offer fields that need to be updated (e.g., `name`, `discount`, etc.).
 * Return Value:
 *   - On success: JSON message confirming the update and the updated offer.
 *   - On failure (e.g., offer not found): 404 status with a message indicating the offer was not found.
 */
router.put("/update/:id", (req, res) => {
  const idx = data.offers.findIndex(o => o.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Offer not found" });

  Object.assign(data.offers[idx], req.body); // Update offer fields with provided body data
  res.json({ message: "Offer updated", offer: data.offers[idx] }); // Respond with updated offer
});

/**
 * Route: DELETE /delete/:id
 * Functionality: Deletes an existing offer by its ID.
 * Parameters (Route):
 *   - id (number): The ID of the offer to be deleted.
 * Return Value:
 *   - On success: JSON message confirming the deletion.
 *   - On failure (e.g., offer not found): 404 status with a message indicating the offer was not found.
 */
router.delete("/delete/:id", (req, res) => {
  const idx = data.offers.findIndex(o => o.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Offer not found" });

  data.offers.splice(idx, 1); // Remove the offer from the list
  res.json({ message: "Offer deleted" }); // Respond with confirmation of deletion
});

module.exports = router;
