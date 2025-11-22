const Story = require('../models/Story');
const User = require('../models/User');
const { storyCache } = require('../config/cache');
const { uploadMiddleware } = require('../middleware/upload');

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
const createStory = [
  uploadMiddleware.single('media'),
  async (req, res) => {
    try {
      const { caption } = req.body;
      const authorId = req.user._id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Media file is required'
        });
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      
      const story = new Story({
        author: authorId,
        caption,
        media: {
          type: isVideo ? 'video' : 'image',
          url: `/uploads/stories/${req.file.filename}`,
          thumbnail: isVideo ? `/uploads/stories/thumb_${req.file.filename}` : undefined
        }
      });

      await story.save();
      await story.populate('author', 'name profileId profileImage isVerified');

      // Clear cache
      storyCache.flushAll();

      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        story
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
];

// @desc    Get user stories for home feed
// @route   GET /api/stories/feed
// @access  Private
const getStoriesFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Check cache first
    const cacheKey = `stories_feed:${currentUserId}`;
    let cachedStories = storyCache.get(cacheKey);

    if (cachedStories) {
      return res.status(200).json(cachedStories);
    }

    // Get current user's following list
    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = [...currentUser.following, currentUserId]; // Include own stories

    // Group stories by user
    const stories = await Story.aggregate([
      {
        $match: {
          author: { $in: followingIds },
          isActive: true,
          expiresAt: { $gt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
          pipeline: [
            { $project: { name: 1, profileId: 1, profileImage: 1, isVerified: 1 } }
          ]
        }
      },
      {
        $unwind: '$authorInfo'
      },
      {
        $group: {
          _id: '$author',
          author: { $first: '$authorInfo' },
          stories: {
            $push: {
              _id: '$_id',
              media: '$media',
              caption: '$caption',
              viewsCount: '$viewsCount',
              createdAt: '$createdAt',
              expiresAt: '$expiresAt'
            }
          },
          latestStoryTime: { $max: '$createdAt' }
        }
      },
      {
        $sort: { latestStoryTime: -1 }
      }
    ]);

    const result = {
      success: true,
      stories
    };

    // Cache for 10 minutes
    storyCache.set(cacheKey, result, 600);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's own stories
// @route   GET /api/stories/my
// @access  Private
const getMyStories = async (req, res) => {
  try {
    const authorId = req.user._id;

    const stories = await Story.find({
      author: authorId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'name profileId profileImage isVerified')
    .sort({ createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      stories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get specific user's stories
// @route   GET /api/stories/user/:profileId
// @access  Private
const getUserStories = async (req, res) => {
  try {
    const { profileId } = req.params;
    const currentUserId = req.user._id;

    // Find user by profile ID
    const user = await User.findOne({ profileId }).select('_id');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stories = await Story.find({
      author: user._id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'name profileId profileImage isVerified')
    .sort({ createdAt: -1 })
    .lean();

    // Add view status for current user
    const storiesWithViewStatus = stories.map(story => ({
      ...story,
      isViewedByUser: story.views.some(view => view.user.toString() === currentUserId.toString()),
      views: undefined // Remove views array to reduce payload size
    }));

    res.status(200).json({
      success: true,
      stories: storiesWithViewStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    View story
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story || !story.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if story hasn't expired
    if (story.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Story has expired'
      });
    }

    const isNewView = await story.addView(userId);

    // Clear cache if new view
    if (isNewView) {
      storyCache.flushAll();
    }

    res.status(200).json({
      success: true,
      message: isNewView ? 'Story viewed successfully' : 'Story already viewed',
      viewsCount: story.viewsCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user is the author
    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own stories'
      });
    }

    // Soft delete
    story.isActive = false;
    await story.save();

    // Clear cache
    storyCache.flushAll();

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get story viewers
// @route   GET /api/stories/:id/viewers
// @access  Private
const getStoryViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story || !story.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user is the author
    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own story viewers'
      });
    }

    // Populate viewer information
    await story.populate('views.user', 'name profileId profileImage isVerified');

    const viewers = story.views
      .sort((a, b) => b.viewedAt - a.viewedAt) // Sort by most recent first
      .map(view => ({
        user: view.user,
        viewedAt: view.viewedAt
      }));

    res.status(200).json({
      success: true,
      viewers,
      totalViews: story.viewsCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createStory,
  getStoriesFeed,
  getMyStories,
  getUserStories,
  viewStory,
  deleteStory,
  getStoryViewers
};