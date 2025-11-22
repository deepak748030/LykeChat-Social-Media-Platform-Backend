const express = require('express');
const {
  createAdvertisement,
  getAdvertisementsFeed,
  getAdvertisement,
  recordClick,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementAnalytics
} = require('../controllers/adController');
const { protect } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Advertisement routes
router.get('/feed', getAdvertisementsFeed);
router.post('/', protect, createAdvertisement, handleUploadError); // Admin only in production
router.get('/:id', getAdvertisement);
router.post('/:id/click', recordClick);
router.get('/:id/analytics', protect, getAdvertisementAnalytics); // Admin only in production
router.put('/:id', protect, updateAdvertisement); // Admin only in production
router.delete('/:id', protect, deleteAdvertisement); // Admin only in production

module.exports = router;