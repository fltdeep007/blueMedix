const express = require('express');
const router = express.Router();
const regionalAdminController = require('../Controllers/regionalAdminController');
const {authenticate} = require('../middleware/authMiddleware');
const { getOrdersByRegion }  = require("../Controllers/orderController");

// Protect all routes with authentication middleware
router.use(authenticate);

// Routes for seller management by regional admin
router.get("/regAdmin" , getOrdersByRegion);
router.get('/sellers/all', regionalAdminController.getSellers);
router.get('/sellers/approved', regionalAdminController.getApprovedSellers);
router.put('/sellers/:sellerId/approve', regionalAdminController.approveSeller);
router.put('/sellers/:sellerId/reject', regionalAdminController.rejectSeller);
// router.post('/sellers/process', regionalAdminController.processSellerApproval);

module.exports = router;