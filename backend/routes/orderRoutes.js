
const express = require('express');
const router = express.Router();
const orderController = require('../Controller/orderController');
const auth = require('../middleware/auth');

// Order routes
router.post('/', auth, orderController.placeOrder);
router.get('/:orderId', auth, orderController.getOrderDetails);
router.get('/customer', auth, orderController.listCustomerOrders);
router.put('/:orderId/cancel', auth, orderController.cancelOrder);
router.get('/track/:orderId', auth, orderController.trackOrder);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);

// Complaints
router.post('/complaints', auth, orderController.raiseComplaint);

// Cart routes
router.get('/cart', auth, orderController.getCart);
router.post('/cart/add/:productId', auth, orderController.addToCart);
router.put('/cart/update/:itemId', auth, orderController.updateCartItem);
router.delete('/cart/remove/:itemId', auth, orderController.removeFromCart);

// Invoice routes
router.post('/invoices/generate/:orderId', auth, orderController.generateInvoice);
router.get('/invoices/:invoiceId', auth, orderController.getInvoiceDetails);

module.exports = router;