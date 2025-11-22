const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { postCache } = require('../config/cache');

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;
    const authorId = req.user._id;

    if (!content || !postId) {
      return res.status(400).json({
        success: false,
        message: 'Content and post ID are required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If replying to a comment, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || !parentComment.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const comment = new Comment({
      content,
      post: postId,
      author: authorId,
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('author', 'name profileId profileImage isVerified');

    // Clear cache
    postCache.del(`post:${postId}`);
    postCache.del(`comments:${postId}`);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get post comments
// @route   GET /api/comments/post/:postId
// @access  Public
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?._id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments (not replies)
    const comments = await Comment.find({ 
      post: postId, 
      parentComment: null,
      isActive: true 
    })
    .populate('author', 'name profileId profileImage isVerified')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name profileId profileImage isVerified'
      },
      select: '-likes', // Exclude likes from replies
      options: { limit: 3 } // Show only first 3 replies
    })
    .select('-likes') // Exclude likes array
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Get liked comments in batch for better performance
    let likedCommentIds = new Set();
    let likedReplyIds = new Set();
    
    if (currentUserId) {
      const allCommentIds = comments.flatMap(c => [c._id, ...c.replies.map(r => r._id)]);
      const likedComments = await Comment.find({
        _id: { $in: allCommentIds },
        'likes.user': currentUserId
      }).select('_id').lean();
      
      likedCommentIds = new Set(likedComments.map(c => c._id.toString()));
    }
    
    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      isLikedByUser: likedCommentIds.has(comment._id.toString()),
      replies: comment.replies.map(reply => ({
        ...reply,
        isLikedByUser: likedCommentIds.has(reply._id.toString())
      }))
    }));

    const total = await Comment.countDocuments({ 
      post: postId, 
      parentComment: null,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      comments: commentsWithLikeStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get comment replies
// @route   GET /api/comments/:commentId/replies
// @access  Public
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const currentUserId = req.user?._id;

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment || !parentComment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const replies = await Comment.find({ 
      parentComment: commentId,
      isActive: true 
    })
    .populate('author', 'name profileId profileImage isVerified')
    .sort({ createdAt: 1 }) // Replies sorted chronologically
    .skip(skip)
    .limit(limit)
    .lean();

    // Add like status for current user
    const repliesWithLikeStatus = replies.map(reply => ({
      ...reply,
      isLikedByUser: currentUserId ? 
        reply.likes.some(like => like.user.toString() === currentUserId.toString()) : 
        false,
      likes: undefined // Remove likes array to reduce payload size
    }));

    const total = await Comment.countDocuments({ 
      parentComment: commentId,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      replies: repliesWithLikeStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
const toggleCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment || !comment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isLiked = comment.isLikedBy(userId);
    let action;

    if (isLiked) {
      await comment.unlike(userId);
      action = 'unliked';
    } else {
      await comment.like(userId);
      action = 'liked';
    }

    // Clear cache
    postCache.del(`comments:${comment.post}`);

    res.status(200).json({
      success: true,
      message: `Comment ${action} successfully`,
      isLiked: !isLiked,
      likesCount: comment.likesCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    // Clear cache
    postCache.del(`comments:${comment.post}`);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const comment = await Comment.findById(id);
    if (!comment || !comment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'name profileId profileImage isVerified');

    // Clear cache
    postCache.del(`comments:${comment.post}`);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createComment,
  getPostComments,
  getCommentReplies,
  toggleCommentLike,
  deleteComment,
  updateComment
};