const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

// Protect all routes with authentication middleware
router.use(authenticate);

// Regional Admin routes
router.get('/regional-admins', adminController.getRegionalAdmins); // to fetch all approved admins 
router.get('/regional-admins/pending', adminController.getPendingRegionalAdmins); // to fetch all pending admins 
router.put('/regional-admins/:adminId/approve', adminController.approveRegionalAdmin);
router.put('/regional-admins/:adminId/decline', adminController.declineRegionalAdmin);

module.exports = router;