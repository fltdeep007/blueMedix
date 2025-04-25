const express = require("express");
const multer = require('multer');
const fs = require("fs");
const router = express.Router();
const {  placeOrder, updateOrderStatus, getOrderById, getOrderTrackingStatus, getOrdersByCustomerId, getOrdersBySellerId, getOrders, cancelOrder  , getSellerOrderById} = require("../Controllers/orderController");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 16 * 1024 * 1024 } }); // Apply size limit here too


router.post("/create", upload.single('prescription_image') , placeOrder); //for customer and seller to place order
router.put("/status/:orderId", updateOrderStatus); // for seller to place order body should be "status": "dispatched" or delivered , accepted , rejected , cancelled
router.get("/", getOrders); // to get all orders 
router.get("/:orderId", getOrderById);

router.get("/user/:userId", getOrdersByCustomerId);
router.get("/seller/:sellerId", getOrdersBySellerId);
router.get("/track/:orderId", getOrderTrackingStatus);
router.put("/cancel/:id", cancelOrder); // only for customer to cancel valid only when order is not dispatched
router.get("/seller/:sellerId/:orderId", getSellerOrderById);


module.exports = router;