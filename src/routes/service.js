const express = require('express');
const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  addServiceReview,
  getTrendingServices,
  getMyServices
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Service routes
router.get('/trending', getTrendingServices);
router.get('/my', protect, getMyServices);
router.get('/', getServices);
router.post('/', protect, createService, handleUploadError);
router.get('/:id', getService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);
router.post('/:id/review', protect, addServiceReview);

module.exports = router;