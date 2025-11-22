const express = require('express');
const {
  createComment,
  getPostComments,
  getCommentReplies,
  toggleCommentLike,
  deleteComment,
  updateComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Comment routes
router.post('/', protect, createComment);
router.get('/post/:postId', getPostComments);
router.get('/:commentId/replies', getCommentReplies);
router.post('/:id/like', protect, toggleCommentLike);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;