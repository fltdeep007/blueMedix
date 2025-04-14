// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// Product Catalog routes
router.get('/', productController.listProducts);
router.get('/top-selling', productController.getTopSellingProducts);
router.get('/popularProducts', productController.getPopularProducts);
router.get('/:productId', productController.getProductDetails);

module.exports = router;