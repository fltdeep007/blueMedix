const express = require("express");
const router = express.Router();
const data = require("../db/data.json"); // Simulated in-memory database

/**
 * Route: POST /submit
 * Functionality: Submits a new feedback entry and adds it to the feedback list.
 * Parameters (Body):
 *   - feedback (object): The feedback data to be submitted. This could include properties such as user ID, comments, rating, etc.
 * Return Value:
 *   - 201 status with a JSON message confirming the feedback submission and the submitted feedback object.
 */
router.post("/submit", (req, res) => {
  const feedback = req.body;
  data.feedback.push(feedback); // Add the new feedback to the list
  res.status(201).json({ message: "Feedback submitted", feedback }); // Respond with confirmation and feedback data
});

/**
 * Route: GET /list
 * Functionality: Retrieves all submitted feedback entries.
 * Parameters: None
 * Return Value:
 *   - JSON array containing all feedback entries stored in the system.
 */
router.get("/list", (req, res) => res.json(data.feedback)); // Respond with all feedback in the system

module.exports = router;
