const User = require('../models/User');
const Post = require('../models/Post');
const { userCache } = require('../config/cache');
const { uploadMiddleware } = require('../middleware/upload');

// @desc    Get user profile
// @route   GET /api/users/:profileId
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const currentUserId = req.user?._id;

    // Check cache first
    const cacheKey = `profile:${profileId}`;
    let user = userCache.get(cacheKey);

    if (!user) {
      user = await User.findOne({ profileId })
        .select('-phone -email')
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Cache the user profile
      userCache.set(cacheKey, user, 1800); // 30 minutes
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId) {
      isFollowing = user.followers.includes(currentUserId.toString());
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        isFollowing
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.phone;
    delete updateData.followers;
    delete updateData.following;
    delete updateData.followersCount;
    delete updateData.followingCount;
    delete updateData.postsCount;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear cache
    userCache.del(`user:${userId}`);
    userCache.del(`profile:${user.profileId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/profile/image
// @access  Private
const uploadProfileImage = [
  uploadMiddleware.single('profileImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const userId = req.user._id;
      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
      ).select('-phone');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Clear cache
      userCache.del(`user:${userId}`);
      userCache.del(`profile:${user.profileId}`);

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
];

// @desc    Follow/Unfollow user
// @route   POST /api/users/:profileId/follow
// @access  Private
const toggleFollow = async (req, res) => {
  try {
    const { profileId } = req.params;
    const currentUserId = req.user._id;

    if (profileId === req.user.profileId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const userToFollow = await User.findOne({ profileId });
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      await currentUser.unfollow(userToFollow._id);
      
      // Clear cache
      userCache.del(`user:${currentUserId}`);
      userCache.del(`profile:${currentUser.profileId}`);
      userCache.del(`profile:${userToFollow.profileId}`);

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await currentUser.follow(userToFollow._id);
      
      // Clear cache
      userCache.del(`user:${currentUserId}`);
      userCache.del(`profile:${currentUser.profileId}`);
      userCache.del(`profile:${userToFollow.profileId}`);

      res.status(200).json({
        success: true,
        message: 'User followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user posts
// @route   GET /api/users/:profileId/posts
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const { profileId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ profileId }).select('_id');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await Post.find({ author: user._id, isActive: true })
      .populate('author', 'name profileId profileImage isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({ author: user._id, isActive: true });

    res.status(200).json({
      success: true,
      posts,
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

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const searchRegex = new RegExp(q.trim(), 'i');

    // Use text search for better performance
    const users = await User.find({
      $text: { $search: q.trim() },
      isActive: true
    })
    .select('name profileId profileImage profession followersCount isVerified')
    .sort({ score: { $meta: 'textScore' }, followersCount: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    const total = await User.countDocuments({
      $text: { $search: q.trim() },
      isActive: true
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const currentUser = await User.findById(currentUserId).select('following interests');

    // Get users that current user is not following
    const suggestions = await User.find({
      _id: { 
        $ne: currentUserId,
        $nin: currentUser.following 
      },
      isActive: true
    })
    .select('name profileId profileImage profession followersCount isVerified interests')
    .sort({ followersCount: -1 })
    .limit(limit)
    .lean();

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfileImage,
  toggleFollow,
  getUserPosts,
  searchUsers,
  getSuggestedUsers
};