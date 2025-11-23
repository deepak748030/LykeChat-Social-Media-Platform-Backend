const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, 'Name is required'], // Made optional for initial signup
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  profileId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    // required: [true, 'Profile ID is required'], // Made optional for initial signup
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Profile ID can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows multiple null values
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date
  },
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  tahsil: {
    type: String,
    trim: true
  },
  village: {
    type: String,
    trim: true
  },
  profession: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  website: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Drop old indexes and create new ones
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ profileId: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ followersCount: -1 }); // For trending users
userSchema.index({ name: 'text', profileId: 'text', profession: 'text' }); // For search

// Virtual for posts
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author'
});

// Methods
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.phone; // Remove sensitive data
  return userObject;
};

userSchema.methods.follow = async function (userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    this.followingCount++;
    await this.save();

    // Update follower's followers list
    const userToFollow = await this.constructor.findById(userId);
    if (userToFollow && !userToFollow.followers.includes(this._id)) {
      userToFollow.followers.push(this._id);
      userToFollow.followersCount++;
      await userToFollow.save();
    }
  }
};

userSchema.methods.unfollow = async function (userId) {
  const followingIndex = this.following.indexOf(userId);
  if (followingIndex > -1) {
    this.following.splice(followingIndex, 1);
    this.followingCount--;
    await this.save();

    // Update follower's followers list
    const userToUnfollow = await this.constructor.findById(userId);
    if (userToUnfollow) {
      const followerIndex = userToUnfollow.followers.indexOf(this._id);
      if (followerIndex > -1) {
        userToUnfollow.followers.splice(followerIndex, 1);
        userToUnfollow.followersCount--;
        await userToUnfollow.save();
      }
    }
  }
};

// Pre-save middleware to handle unique constraints
userSchema.pre('save', function (next) {
  // If profileId is empty string, set it to null for sparse index
  if (this.profileId === '') {
    this.profileId = null;
  }
  // If email is empty string, set it to null for sparse index
  if (this.email === '') {
    this.email = null;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
