const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const orderController = require("../controller/orderController");

router.post("/create", auth, orderController.placeOrder);
router.post("/invoices/generate/:orderId", auth, orderController.generateInvoice);
router.get("/invoices/:invoiceId", auth, orderController.getInvoiceDetails);

module.exports = router;






