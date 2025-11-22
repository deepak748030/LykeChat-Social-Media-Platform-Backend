const express = require('express');
const {
  createPost,
  getHomeFeed,
  getPost,
  toggleLike,
  deletePost,
  getTrendingPosts,
  sharePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Post routes
router.get('/trending', getTrendingPosts);
router.get('/feed', protect, getHomeFeed);
router.post('/', protect, createPost, handleUploadError);
router.get('/:id', getPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/share', protect, sharePost);
router.delete('/:id', protect, deletePost);

module.exports = router;