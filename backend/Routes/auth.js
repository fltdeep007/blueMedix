const express = require("express");
const router = express.Router();
const authController = require('../Controllers/authController')
const { authenticate } = require('../middleware/authMiddleware');  // to get token and pass user role 
const User = require("../Models/User/User")


router.post('/login/otp', authController.requestOTP); 
router.post('/verify/otp', authController.verifyOTP);
router.post('/register', authController.registerUser);


router.post('/register/SuperAdmin', authController.createSuperAdmin);





router.post('/' , authController.loginUser)





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
// router.post("/verify-otp", (req, res) => {
//   const { phone_number, otp } = req.body;
//   if (otp === "123456") {
//     const token = jwt.sign({ phone_number }, SECRET, { expiresIn: "1h" }); // Create JWT valid for 1 hour
//     res.json({ token });
//   } else {
//     res.status(401).json({ message: "Invalid OTP" });
//   }
// });

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
router.get("/me", authenticate, async (req, res) => {
  try {
    // Fetch full user details by ID
    const user = await User.findById(req.user.user_id).select('-password'); // exclude password

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Error in /me route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// router.post('/super-admin/create', authController.createSuperAdmin); // Developer only
// router.get('/super-admin/regional-admins', auth(['SuperAdmin']), authController.getRegionalAdmins);
// router.post('/super-admin/regional-admin', auth(['SuperAdmin']), authController.registerUser);

// Regional Admin routes (protected)
// router.get('/regional-admin/sellers/pending', auth(['RegionalAdmin']), authController.getSellersPendingApproval);
// router.put('/regional-admin/sellers/:sellerId/approve', auth(['RegionalAdmin']), authController.approveSeller);
// router.put('/regional-admin/sellers/:sellerId/reject', auth(['RegionalAdmin']), authController.rejectSeller);

module.exports = router;
