const Post = require('../models/Post');
const User = require('../models/User');
const { postCache } = require('../config/cache');
const { uploadMiddleware } = require('../middleware/upload');

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = [
  uploadMiddleware.multiple('media'),
  async (req, res) => {
    try {
      const { caption, tags, location, visibility, commentsEnabled } = req.body;
      const authorId = req.user._id;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one media file is required'
        });
      }

      // Process uploaded files
      const media = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
          type: isVideo ? 'video' : 'image',
          url: `/uploads/posts/${file.filename}`,
          thumbnail: isVideo ? `/uploads/posts/thumb_${file.filename}` : undefined
        };
      });

      const post = new Post({
        author: authorId,
        caption,
        media,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        location: location ? JSON.parse(location) : undefined,
        visibility: visibility || 'public', // Default to public if not provided
        commentsEnabled: commentsEnabled !== undefined ? JSON.parse(commentsEnabled) : true // Default to true if not provided
      });

      await post.save();

      // Update user's posts count
      await User.findByIdAndUpdate(authorId, { $inc: { postsCount: 1 } });

      // Populate author info
      await post.populate('author', 'name profileId profileImage isVerified');

      // Clear relevant caches
      postCache.del('home_feed');

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
];

// @desc    Get home feed
// @route   GET /api/posts/feed
// @access  Private
const getHomeFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `feed:${currentUserId}:${page}:${limit}`;
    let cachedFeed = postCache.get(cacheKey);

    if (cachedFeed) {
      return res.status(200).json(cachedFeed);
    }

    // Get current user's following list
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = [...currentUser.following, currentUserId]; // Include own posts

    // Get posts from followed users and public posts
    const posts = await Post.find({
      $or: [
        { author: { $in: followingIds } }, // Posts from followed users or self
        { visibility: 'public' } // Public posts
      ],
      isActive: true
    })
      .populate('author', 'name profileId profileImage isVerified')
      .select('-likes') // Exclude likes array to reduce payload
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add like status for current user
    // Get user's liked posts in a single query
    const likedPosts = await Post.find({
      _id: { $in: posts.map(p => p._id) },
      'likes.user': currentUserId
    }).select('_id').lean();

    const likedPostIds = new Set(likedPosts.map(p => p._id.toString()));

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLikedByUser: likedPostIds.has(post._id.toString())
    }));

    const total = await Post.countDocuments({
      $or: [
        { author: { $in: followingIds } },
        { visibility: 'public' }
      ],
      isActive: true
    });

    const result = {
      success: true,
      posts: postsWithLikeStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Cache the result for 5 minutes
    postCache.set(cacheKey, result, 300);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id;

    // Check cache first
    const cacheKey = `post:${id}`;
    let post = postCache.get(cacheKey);

    if (!post) {
      post = await Post.findById(id)
        .populate('author', 'name profileId profileImage isVerified')
        .select('-likes') // Exclude likes array
        .lean();

      if (!post || !post.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      // Check visibility for private posts
      if (post.visibility === 'private' && (!currentUserId || post.author._id.toString() !== currentUserId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access to this private post is denied.'
        });
      }

      // Cache the post for 30 minutes
      postCache.set(cacheKey, post, 1800);
    }

    // Check if user liked this post (separate query for better performance)
    let isLikedByUser = false;
    if (currentUserId) {
      const likedPost = await Post.findOne({
        _id: id,
        'likes.user': currentUserId
      }).select('_id').lean();
      isLikedByUser = !!likedPost;
    }

    res.status(200).json({
      success: true,
      post: {
        ...post,
        isLikedByUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isLiked = post.isLikedBy(userId);
    let action;

    if (isLiked) {
      await post.unlike(userId);
      action = 'unliked';
    } else {
      await post.like(userId);
      action = 'liked';
    }

    // Clear cache
    postCache.del(`post:${id}`);
    postCache.flushAll(); // Clear all feed caches

    res.status(200).json({
      success: true,
      message: `Post ${action} successfully`,
      isLiked: !isLiked,
      likesCount: post.likesCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    // Update user's posts count
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

    // Clear cache
    postCache.del(`post:${id}`);
    postCache.flushAll(); // Clear all feed caches

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
const getTrendingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `trending:${page}:${limit}`;
    let cachedTrending = postCache.get(cacheKey);

    if (cachedTrending) {
      return res.status(200).json(cachedTrending);
    }

    // Get trending posts (sorted by likes and comments in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      isActive: true,
      visibility: 'public', // Only public posts can be trending
      createdAt: { $gte: oneDayAgo }
    })
      .populate('author', 'name profileId profileImage isVerified')
      .select('-likes') // Exclude likes array
      .sort({
        likesCount: -1,
        commentsCount: -1,
        createdAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({
      isActive: true,
      visibility: 'public',
      createdAt: { $gte: oneDayAgo }
    });

    const result = {
      success: true,
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };

    // Cache for 15 minutes
    postCache.set(cacheKey, result, 900);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
const sharePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment shares count
    post.sharesCount++;
    await post.save();

    // Clear cache
    postCache.del(`post:${id}`);

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      sharesCount: post.sharesCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPost,
  getHomeFeed,
  getPost,
  toggleLike,
  deletePost,
  getTrendingPosts,
  sharePost
};
