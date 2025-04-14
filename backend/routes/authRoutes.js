// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/login/otp', authController.requestOTP);
router.post('/verify/otp', authController.verifyOTP);

module.exports = router;