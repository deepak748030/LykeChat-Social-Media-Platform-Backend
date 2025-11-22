const express = require('express');
const {
  createStory,
  getStoriesFeed,
  getMyStories,
  getUserStories,
  viewStory,
  deleteStory,
  getStoryViewers
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Story routes
router.post('/', protect, createStory, handleUploadError);
router.get('/feed', protect, getStoriesFeed);
router.get('/my', protect, getMyStories);
router.get('/user/:profileId', protect, getUserStories);
router.post('/:id/view', protect, viewStory);
router.get('/:id/viewers', protect, getStoryViewers);
router.delete('/:id', protect, deleteStory);

module.exports = router;