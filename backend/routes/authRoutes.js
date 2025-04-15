// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../Controller/authControler');

// Authentication routes
router.post('/login/otp', authController.requestOTP);
router.post('/verify/otp', authController.verifyOTP);
router.post('/signup', authController.signup);
router.post('/verify/signup', authController.verifySignup);

module.exports = router;