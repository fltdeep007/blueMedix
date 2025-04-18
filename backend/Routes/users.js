const express = require("express");
const fs = require("fs");
const router = express.Router();
const users = require("../data/users.json"); // Simulated in-memory database of users

/**
 * Route: POST /create
 * Functionality: Creates a new user and adds them to the users list.
 * Request Body:
 *   - User object: Information about the new user to be added.
 * Return Value:
 *   - JSON message confirming the user creation.
 */
router.post("/create", (req, res) => {
  users.push(req.body); // Add the new user to the users array
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2)); // Save the updated list to the file
  res.status(201).json({ message: "User created" }); // Return confirmation
});

/**
 * Route: PUT /update/:id
 * Functionality: Updates the user with the specified ID.
 * Request Params:
 *   - id (int): The ID of the user to update.
 * Request Body:
 *   - User object: The updated user information.
 * Return Value:
 *   - JSON message confirming the update.
 */
router.put("/update/:id", (req, res) => {
  const id = parseInt(req.params.id); // Get the user ID from the route parameter
  Object.assign(users[id], req.body); // Update the user's data
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2)); // Save the updated list to the file
  res.json({ message: "User updated" }); // Return confirmation
});

/**
 * Route: DELETE /delete/:id
 * Functionality: Deletes the user with the specified ID.
 * Request Params:
 *   - id (int): The ID of the user to delete.
 * Return Value:
 *   - JSON message confirming the deletion.
 */
router.delete("/delete/:id", (req, res) => {
  users.splice(req.params.id, 1); // Remove the user from the array by ID
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2)); // Save the updated list to the file
  res.json({ message: "User deleted" }); // Return confirmation
});

/**
 * Route: GET /:id
 * Functionality: Retrieves the user with the specified ID.
 * Request Params:
 *   - id (int): The ID of the user to retrieve.
 * Return Value:
 *   - JSON object containing the user's data.
 */
router.get("/:id", (req, res) => {
  res.json(users[req.params.id]); // Return the user data by ID
});

/**
 * Route: GET /list
 * Functionality: Retrieves the list of all users.
 * Return Value:
 *   - JSON array of all users.
 */
router.get("/list", (req, res) => {
  res.json(users); // Return the list of all users
});

module.exports = router;
