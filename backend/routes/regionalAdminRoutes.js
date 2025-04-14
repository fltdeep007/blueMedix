// routes/regionalAdminRoutes.js
const express = require('express');
const router = express.Router();
const regionalAdminController = require('../controllers/regionalAdminController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Apply middleware to all routes
router.use(auth);
router.use(checkRole('RegionalAdmin'));

// Regional Admin routes
router.get('/sellers', regionalAdminController.getSellerList);
router.put('/sellers/:sellerId', regionalAdminController.updateSeller);
router.get('/orders', regionalAdminController.trackOrders);
router.get('/orders/:orderId', regionalAdminController.trackOrder);

module.exports = router;