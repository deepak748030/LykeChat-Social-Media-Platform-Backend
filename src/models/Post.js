const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caption: {
    type: String,
    maxlength: [2000, 'Caption cannot exceed 2000 characters']
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String, // For videos
    duration: Number // For videos in seconds
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  commentsEnabled: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1, commentsCount: -1 }); // For trending posts
postSchema.index({ tags: 1 });
postSchema.index({ visibility: 1 });

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  options: { sort: { createdAt: -1 } }
});

// Methods
postSchema.methods.like = async function (userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());

  if (!existingLike) {
    this.likes.push({ user: userId });
    this.likesCount++;
    await this.save();
    return true; // Liked
  }
  return false; // Already liked
};

postSchema.methods.unlike = async function (userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    this.likesCount--;
    await this.save();
    return true; // Unliked
  }
  return false; // Not liked
};

postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

module.exports = mongoose.model('Post', postSchema);
