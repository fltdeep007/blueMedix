const express = require("express");
const fs = require("fs");
const router = express.Router();
const { placeOrder, updateOrderStatus, getOrderById, getOrderTrackingStatus, getOrdersByCustomerId, getOrdersBySellerId, getOrders, cancelOrder } = require("../Controllers/orderController");

router.post("/create", placeOrder); //for customer and seller to place order
router.put("/status/:orderId", updateOrderStatus); // for seller to place order body should be "status": "dispatched" or delivered , accepted , rejected , cancelled
router.get("/", getOrders); // to get all orders 
router.get("/:orderId", getOrderById);
router.get("/user/:userId", getOrdersByCustomerId);
router.get("/seller/:sellerId", getOrdersBySellerId);
router.get("/track/:orderId", getOrderTrackingStatus);
router.put("/cancel/:id", cancelOrder);


module.exports = router;