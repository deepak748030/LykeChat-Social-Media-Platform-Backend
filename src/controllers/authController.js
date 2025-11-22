const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { userCache } = require('../config/cache');

// @desc    Login or Register user
// @route   POST /api/auth/login
// @access  Public
const loginOrRegister = async (req, res) => {
  try {
    const { phone, otp, userDetails } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // For demo purposes, we use a fixed OTP
    const validOTP = process.env.DEFAULT_OTP || '123456';

    // If OTP is not provided, send OTP (simulation)
    if (!otp) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        otpSent: true,
        phone: phone
      });
    }

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
      // User exists - login
      user.lastSeen = new Date();
      await user.save();

      // Clear cache for this user
      userCache.del(`user:${user._id}`);

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        isNewUser: false,
        token,
        user: {
          _id: user._id,
          name: user.name,
          profileId: user.profileId,
          profileImage: user.profileImage,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          isVerified: user.isVerified
        }
      });
    } else {
      // User doesn't exist - need user details for registration
      if (!userDetails || !userDetails.name || !userDetails.profileId) {
        return res.status(400).json({
          success: false,
          message: 'User details required for registration',
          isNewUser: true,
          phone: phone
        });
      }

      // Create new user
      user = new User({
        phone,
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
      });

      await user.save();

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        isNewUser: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          profileId: user.profileId,
          profileImage: user.profileImage,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          isVerified: user.isVerified
        }
      });
    }
  } catch (error) {
    console.error('Login/Register error:', error);
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
  loginOrRegister,
  getMe
};