const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { getAllSellers , getUsers} = require('../Controllers/userController')
const { authorizeRole } = require('../middleware/authMiddleware');
// const Category = require('../Models/Products/Category');
const { updateCategory } = require('../Services/categoryService');
const { updCat } = require('../Controllers/categoryController');
// const { getAllUsers } = require('../Services/userService');

// Protect all routes with authentication middleware
router.use(authenticate);

// Regional Admin routes
router.put('/category/:categoryId' , authorizeRole("SuperAdmin") , updCat)
router.get('/sellers' ,authorizeRole("SuperAdmin"), getAllSellers)
router.get('/customers' ,authorizeRole("SuperAdmin"), getUsers)
router.get('/regional-admins', authorizeRole("SuperAdmin"), adminController.getRegionalAdmins); // to fetch all approved admins 
// router.get('/regional-admins/pending',authorizeRole("SuperAdmin"), adminController.getPendingRegionalAdmins); // to fetch all pending admins 
router.put('/regional-admins/:adminId/approve', adminController.approveRegionalAdmin);
router.put('/regional-admins/:adminId/decline', adminController.declineRegionalAdmin);

module.exports = router;