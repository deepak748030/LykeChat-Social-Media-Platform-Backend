const express = require('express');
const {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  toggleFollow,
  getUserPosts,
  searchUsers,
  getSuggestedUsers
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

const router = express.Router();

// User routes
router.get('/search', searchUsers);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/profile', protect, updateProfile); // GET current user profile
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, uploadProfileImage, handleUploadError);
router.get('/:profileId', getUserProfile);
router.post('/:profileId/follow', protect, toggleFollow);
router.get('/:profileId/posts', getUserPosts);

module.exports = router;