const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const SECRET = "your_jwt_secret";

/**
 * Route: POST /login-otp
 * Functionality: Simulates sending an OTP to a user's phone number.
 * Parameters (Body):
 *   - phone_number (string): The user's phone number.
 * Return Value:
 *   - JSON object containing a message and a hardcoded OTP (for simulation).
 */
router.post("/login-otp", (req, res) => {
  const { phone_number } = req.body;
  const otp = "123456"; // Simulated OTP
  res.json({ message: "OTP sent", otp }); // Responds with the OTP
});

/**
 * Route: POST /verify-otp
 * Functionality: Verifies the submitted OTP and issues a JWT token upon successful verification.
 * Parameters (Body):
 *   - phone_number (string): The user's phone number.
 *   - otp (string): The OTP entered by the user.
 * Return Value:
 *   - On success: JSON object containing a JWT token.
 *   - On failure: 401 status with an error message.
 */
router.post("/verify-otp", (req, res) => {
  const { phone_number, otp } = req.body;
  if (otp === "123456") {
    const token = jwt.sign({ phone_number }, SECRET, { expiresIn: "1h" }); // Create JWT valid for 1 hour
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid OTP" });
  }
});

/**
 * Route: POST /logout
 * Functionality: Simulates user logout (stateless as JWT cannot be invalidated server-side without additional mechanisms).
 * Parameters: None
 * Return Value:
 *   - JSON object confirming logout success.
 */
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

/**
 * Route: GET /me
 * Functionality: Retrieves user information from the JWT token sent in the 'Authorization' header.
 * Parameters (Header):
 *   - Authorization: "Bearer <JWT Token>"
 * Return Value:
 *   - On success: JSON object containing decoded user data (e.g., phone number).
 *   - On missing/invalid token: 401 or 403 status.
 */
router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract JWT from header
  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    res.json({ user }); // Send decoded user data
  });
});

module.exports = router;
