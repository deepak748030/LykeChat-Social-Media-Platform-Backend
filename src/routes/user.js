const express = require('express');
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getUserPosts,
  searchUsers,
  getSuggestedUsers,
  getCurrentUserProfile // Added for getting current user's profile
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadMiddleware, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// User routes
router.get('/search', searchUsers);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/profile', protect, getCurrentUserProfile); // Route to get the current authenticated user's profile
router.put('/profile', protect, uploadMiddleware.single('profileImage'), handleUploadError, updateProfile); // Modified to handle file upload
router.get('/:profileId', getUserProfile);
router.post('/:profileId/follow', protect, toggleFollow);
router.get('/:profileId/posts', getUserPosts);

module.exports = router;
