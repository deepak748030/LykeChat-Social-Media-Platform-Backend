const express = require('express');
const { loginOrRegister, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/login', loginOrRegister);
router.get('/me', protect, getMe);

module.exports = router;