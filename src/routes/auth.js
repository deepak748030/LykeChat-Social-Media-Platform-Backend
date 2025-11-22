const express = require('express');
const { sendOtp, verifyOtpAndAuth, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndAuth);
router.get('/me', protect, getMe);

module.exports = router;