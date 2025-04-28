const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { getAllSellers , getUsers} = require('../Controllers/userController')
const { authorizeRole } = require('../middleware/authMiddleware');
// const { getAllUsers } = require('../Services/userService');

// Protect all routes with authentication middleware
router.use(authenticate);

// Regional Admin routes
router.get('/sellers' ,authorizeRole("SuperAdmin"), getAllSellers)
router.get('/customers' ,authorizeRole("SuperAdmin"), getUsers)
router.get('/regional-admins', authorizeRole("SuperAdmin"), adminController.getRegionalAdmins); // to fetch all approved admins 
// router.get('/regional-admins/pending',authorizeRole("SuperAdmin"), adminController.getPendingRegionalAdmins); // to fetch all pending admins 
router.put('/regional-admins/:adminId/approve', adminController.approveRegionalAdmin);
router.put('/regional-admins/:adminId/decline', adminController.declineRegionalAdmin);

module.exports = router;