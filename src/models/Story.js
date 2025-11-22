const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  media: {
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
  },
  caption: {
    type: String,
    maxlength: [200, 'Story caption cannot exceed 200 characters']
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
// storySchema.index({ author: 1, createdAt: -1 });
// storySchema.index({ expiresAt: 1 });
storySchema.index({ 'views.user': 1 });

// Methods
storySchema.methods.addView = async function (userId) {
  const existingView = this.views.find(view => view.user.toString() === userId.toString());

  if (!existingView) {
    this.views.push({ user: userId });
    this.viewsCount++;
    await this.save();
    return true; // New view
  }
  return false; // Already viewed
};

storySchema.methods.isViewedBy = function (userId) {
  return this.views.some(view => view.user.toString() === userId.toString());
};

module.exports = mongoose.model('Story', storySchema);