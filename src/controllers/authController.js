const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { userCache } = require('../config/cache');

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ phone }).lean();

    if (existingUser) {
      // User is already registered
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        type: 'login',
        phone: phone,
        otp: process.env.DEFAULT_OTP || '123456' // For demo purposes
      });
    } else {
      // New user
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        type: 'signup',
        phone: phone,
        otp: process.env.DEFAULT_OTP || '123456' // For demo purposes
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify OTP and authenticate user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtpAndAuth = async (req, res) => {
  try {
    const { phone, otp, userDetails } = req.body;

    // Validate required fields
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // For demo purposes, we use a fixed OTP
    const validOTP = process.env.DEFAULT_OTP || '123456';

    // Validate OTP
    if (otp !== validOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if user exists
    let user = await User.findOne({ phone });

    if (user) {
      // Existing user - login flow
      user.lastSeen = new Date();
      await user.save();

      // Clear cache for this user
      userCache.del(`user:${user._id}`);

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        type: 'login',
        token,
        user: {
          _id: user._id,
          name: user.name,
          profileId: user.profileId,
          profileImage: user.profileImage,
          bio: user.bio,
          profession: user.profession,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          isVerified: user.isVerified
        }
      });
    } else {
      // New user - signup flow
      let responseType = 'signup';
      let newUserFields = { phone };

      if (userDetails) {
        // If userDetails are provided, use them
        newUserFields = {
          ...newUserFields,
          name: userDetails.name,
          profileId: userDetails.profileId,
          email: userDetails.email,
          dateOfBirth: userDetails.dateOfBirth,
          country: userDetails.country,
          state: userDetails.state,
          district: userDetails.district,
          tahsil: userDetails.tahsil,
          village: userDetails.village,
          profession: userDetails.profession,
          education: userDetails.education,
          interests: userDetails.interests,
          bio: userDetails.bio,
          website: userDetails.website
        };
      }

      // Create new user with provided details or just phone
      user = new User(newUserFields);

      await user.save();

      // Determine response type for frontend navigation
      if (!user.name || !user.profileId) {
        responseType = 'signup_incomplete';
      }

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        type: responseType, // Indicate if profile completion is needed
        token,
        user: {
          _id: user._id,
          name: user.name,
          profileId: user.profileId,
          profileImage: user.profileImage,
          bio: user.bio,
          profession: user.profession,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          isVerified: user.isVerified
        }
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-phone')
      .lean();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtpAndAuth,
  getMe
};
