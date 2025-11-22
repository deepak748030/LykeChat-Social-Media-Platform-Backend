const Advertisement = require('../models/Advertisement');
const { adCache } = require('../config/cache');
const { uploadMiddleware } = require('../middleware/upload');

// @desc    Create new advertisement
// @route   POST /api/advertisements
// @access  Private (Admin only in production)
const createAdvertisement = [
  uploadMiddleware.single('image'),
  async (req, res) => {
    try {
      const {
        title,
        description,
        link,
        type,
        targetAudience,
        budget,
        schedule,
        priority
      } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Advertisement image is required'
        });
      }

      const imageUrl = `/uploads/advertisements/${req.file.filename}`;

      const advertisement = new Advertisement({
        title,
        description,
        image: imageUrl,
        link,
        type,
        targetAudience: targetAudience ? JSON.parse(targetAudience) : undefined,
        budget: budget ? JSON.parse(budget) : undefined,
        schedule: schedule ? JSON.parse(schedule) : undefined,
        priority: priority ? parseInt(priority) : 1
      });

      await advertisement.save();

      // Clear cache
      adCache.flushAll();

      res.status(201).json({
        success: true,
        message: 'Advertisement created successfully',
        advertisement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
];

// @desc    Get active advertisements for feed
// @route   GET /api/advertisements/feed
// @access  Public
const getAdvertisementsFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const userInterests = req.query.interests ? req.query.interests.split(',') : [];

    // Check cache first
    const cacheKey = `ads_feed:${limit}:${userInterests.join(',')}`;
    let cachedAds = adCache.get(cacheKey);

    if (cachedAds) {
      return res.status(200).json(cachedAds);
    }

    const now = new Date();

    // Build match criteria
    const matchCriteria = {
      status: 'active',
      isActive: true,
      'schedule.startDate': { $lte: now },
      'schedule.endDate': { $gte: now }
    };

    // Add interest-based targeting if provided
    if (userInterests.length > 0) {
      matchCriteria.$or = [
        { 'targetAudience.interests': { $in: userInterests } },
        { 'targetAudience.interests': { $exists: false } },
        { 'targetAudience.interests': { $size: 0 } }
      ];
    }

    const advertisements = await Advertisement.find(matchCriteria)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Record impressions (simplified - in production, you'd track per user)
    await Advertisement.updateMany(
      { _id: { $in: advertisements.map(ad => ad._id) } },
      { $inc: { 'metrics.impressions': 1 } }
    );

    const result = {
      success: true,
      advertisements
    };

    // Cache for 15 minutes
    adCache.set(cacheKey, result, 900);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single advertisement
// @route   GET /api/advertisements/:id
// @access  Public
const getAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findById(id);
    if (!advertisement || !advertisement.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      advertisement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record advertisement click
// @route   POST /api/advertisements/:id/click
// @access  Public
const recordClick = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findById(id);
    if (!advertisement || !advertisement.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    await advertisement.recordClick();

    // Clear cache
    adCache.flushAll();

    res.status(200).json({
      success: true,
      message: 'Click recorded successfully',
      redirectUrl: advertisement.link
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update advertisement
// @route   PUT /api/advertisements/:id
// @access  Private (Admin only in production)
const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse JSON fields if they exist
    if (updateData.targetAudience) {
      updateData.targetAudience = JSON.parse(updateData.targetAudience);
    }
    if (updateData.budget) {
      updateData.budget = JSON.parse(updateData.budget);
    }
    if (updateData.schedule) {
      updateData.schedule = JSON.parse(updateData.schedule);
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Clear cache
    adCache.flushAll();

    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      advertisement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete advertisement
// @route   DELETE /api/advertisements/:id
// @access  Private (Admin only in production)
const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    // Soft delete
    advertisement.isActive = false;
    advertisement.status = 'completed';
    await advertisement.save();

    // Clear cache
    adCache.flushAll();

    res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get advertisement analytics
// @route   GET /api/advertisements/:id/analytics
// @access  Private (Admin only in production)
const getAdvertisementAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findById(id);
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    const analytics = {
      id: advertisement._id,
      title: advertisement.title,
      metrics: advertisement.metrics,
      ctr: advertisement.ctr,
      schedule: advertisement.schedule,
      status: advertisement.status,
      performance: {
        impressionsPerDay: advertisement.metrics.impressions > 0 ? 
          Math.round(advertisement.metrics.impressions / 
            Math.max(1, Math.ceil((new Date() - advertisement.schedule.startDate) / (1000 * 60 * 60 * 24)))) : 0,
        clicksPerDay: advertisement.metrics.clicks > 0 ? 
          Math.round(advertisement.metrics.clicks / 
            Math.max(1, Math.ceil((new Date() - advertisement.schedule.startDate) / (1000 * 60 * 60 * 24)))) : 0
      }
    };

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAdvertisement,
  getAdvertisementsFeed,
  getAdvertisement,
  recordClick,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementAnalytics
};