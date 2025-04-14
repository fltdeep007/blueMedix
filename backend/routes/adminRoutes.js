// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Apply middleware to all routes
router.use(auth);
router.use(checkRole('Admin'));

// Product Management
router.get('/products', adminController.listProducts);
router.post('/products', adminController.addProduct);
router.put('/products/:productId', adminController.editProduct);
router.post('/products/bulk-import', adminController.bulkImportProducts);

// User Management
router.get('/sellers', adminController.listSellers);
router.get('/regional-admins', adminController.listRegionalAdmins);
router.get('/regional-admin', adminController.getRegionalAdminList);
router.put('/regional-admin/:sellerId', adminController.updateSeller);
router.get('/customers/find', adminController.findCustomer);

// Reports
router.get('/reports/product-wise', adminController.getProductWiseReport);

module.exports = router;