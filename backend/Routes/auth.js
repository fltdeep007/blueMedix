const express = require("express");
const router = express.Router();
const authController = require('../Controllers/authController')
const { authenticate } = require('../middleware/authMiddleware');  // to get token and pass user role 
const User = require("../Models/User/User")
const { getCustomersInSellerPincode , getUsersInRegionalAdminRegion , getSellersInRegionalAdminRegion} = require('../Controllers/userController')


router.post('/login/otp', authController.requestOTP); 
router.post('/verify/otp', authController.verifyOTP);
router.post('/register', authController.registerUser);
router.post('/check' , authController.checkUserEmail)


router.post('/register/SuperAdmin', authController.createSuperAdmin);





router.post('/' , authController.loginUser)





router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});


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

router.get('/seller/:sellerId' , getCustomersInSellerPincode)
router.get('/regAdmin/customer/:regAdminId' , getUsersInRegionalAdminRegion)
router.get('/regAdmin/seller/:regAdminId' , getSellersInRegionalAdminRegion)

// router.post('/super-admin/create', authController.createSuperAdmin); // Developer only
// router.get('/super-admin/regional-admins', auth(['SuperAdmin']), authController.getRegionalAdmins);
// router.post('/super-admin/regional-admin', auth(['SuperAdmin']), authController.registerUser);

// Regional Admin routes (protected)
// router.get('/regional-admin/sellers/pending', auth(['RegionalAdmin']), authController.getSellersPendingApproval);
// router.put('/regional-admin/sellers/:sellerId/approve', auth(['RegionalAdmin']), authController.approveSeller);
// router.put('/regional-admin/sellers/:sellerId/reject', auth(['RegionalAdmin']), authController.rejectSeller);

module.exports = router;
