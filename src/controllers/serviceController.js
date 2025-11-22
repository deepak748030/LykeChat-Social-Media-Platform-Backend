const Service = require('../models/Service');
const { serviceCache } = require('../config/cache');
const { uploadMiddleware } = require('../middleware/upload');

// @desc    Create new service
// @route   POST /api/services
// @access  Private
const createService = [
  uploadMiddleware.multiple('images'),
  async (req, res) => {
    try {
      const { 
        title, 
        description, 
        category, 
        pricing, 
        location, 
        availability,
        tags 
      } = req.body;
      
      const providerId = req.user._id;

      // Process uploaded images
      const images = req.files ? req.files.map(file => `/uploads/services/${file.filename}`) : [];

      const service = new Service({
        provider: providerId,
        title,
        description,
        category,
        pricing: JSON.parse(pricing),
        location: JSON.parse(location),
        availability: availability ? JSON.parse(availability) : undefined,
        images,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : []
      });

      await service.save();
      await service.populate('provider', 'name profileId profileImage isVerified');

      // Clear cache
      serviceCache.flushAll();

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        service
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
];

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      location,
      priceMin,
      priceMax,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter query
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter['location.address.city'] = new RegExp(location, 'i');
    }

    if (priceMin || priceMax) {
      filter['pricing.minPrice'] = {};
      if (priceMin) filter['pricing.minPrice'].$gte = parseInt(priceMin);
      if (priceMax) filter['pricing.minPrice'].$lte = parseInt(priceMax);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sortBy] = order === 'asc' ? 1 : -1;

    // Check cache first
    const cacheKey = `services:${JSON.stringify({ filter, sortQuery, page, limit })}`;
    let cachedResult = serviceCache.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    const services = await Service.find(filter)
      .populate('provider', 'name profileId profileImage isVerified')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Service.countDocuments(filter);

    const result = {
      success: true,
      services,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    };

    // Cache for 30 minutes
    serviceCache.set(cacheKey, result, 1800);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `service:${id}`;
    let service = serviceCache.get(cacheKey);

    if (!service) {
      service = await Service.findById(id)
        .populate('provider', 'name profileId profileImage isVerified phone')
        .lean();

      if (!service || !service.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Cache for 1 hour
      serviceCache.set(cacheKey, service, 3600);
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = { ...req.body };

    // Parse JSON fields if they exist
    if (updateData.pricing) {
      updateData.pricing = JSON.parse(updateData.pricing);
    }
    if (updateData.location) {
      updateData.location = JSON.parse(updateData.location);
    }
    if (updateData.availability) {
      updateData.availability = JSON.parse(updateData.availability);
    }
    if (updateData.tags) {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own services'
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('provider', 'name profileId profileImage isVerified');

    // Clear cache
    serviceCache.del(`service:${id}`);
    serviceCache.flushAll(); // Clear all service listings

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own services'
      });
    }

    // Soft delete
    service.isActive = false;
    await service.save();

    // Clear cache
    serviceCache.del(`service:${id}`);
    serviceCache.flushAll();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add service review
// @route   POST /api/services/:id/review
// @access  Private
const addServiceReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const service = await Service.findById(id);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if user is the provider (can't review own service)
    if (service.provider.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot review your own service'
      });
    }

    const success = await service.addReview(userId, rating, comment);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this service'
      });
    }

    // Clear cache
    serviceCache.del(`service:${id}`);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      rating: {
        average: service.rating.average,
        count: service.rating.count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get trending services
// @route   GET /api/services/trending
// @access  Public
const getTrendingServices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Check cache first
    const cacheKey = `trending_services:${limit}`;
    let cachedResult = serviceCache.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    const services = await Service.find({ isActive: true })
      .populate('provider', 'name profileId profileImage isVerified')
      .sort({ 
        'rating.average': -1,
        'rating.count': -1,
        isFeatured: -1
      })
      .limit(limit)
      .lean();

    const result = {
      success: true,
      services
    };

    // Cache for 1 hour
    serviceCache.set(cacheKey, result, 3600);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's services
// @route   GET /api/services/my
// @access  Private
const getMyServices = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const services = await Service.find({ provider: userId })
      .populate('provider', 'name profileId profileImage isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Service.countDocuments({ provider: userId });

    res.status(200).json({
      success: true,
      services,
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

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  addServiceReview,
  getTrendingServices,
  getMyServices
};