const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
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
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  repliesCount: {
    type: Number,
    default: 0
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
commentSchema.index({ post: 1, createdAt: -1 });
// commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'likes.user': 1 });

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  options: { sort: { createdAt: 1 } }
});

// Methods
commentSchema.methods.like = async function (userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());

  if (!existingLike) {
    this.likes.push({ user: userId });
    this.likesCount++;
    await this.save();
    return true; // Liked
  }
  return false; // Already liked
};

commentSchema.methods.unlike = async function (userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    this.likesCount--;
    await this.save();
    return true; // Unliked
  }
  return false; // Not liked
};

commentSchema.methods.isLikedBy = function (userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Update parent comment replies count
commentSchema.post('save', async function () {
  if (this.parentComment) {
    await this.constructor.updateOne(
      { _id: this.parentComment },
      { $inc: { repliesCount: 1 } }
    );
  }

  // Update post comments count
  await mongoose.model('Post').updateOne(
    { _id: this.post },
    { $inc: { commentsCount: 1 } }
  );
});

commentSchema.post('remove', async function () {
  if (this.parentComment) {
    await this.constructor.updateOne(
      { _id: this.parentComment },
      { $inc: { repliesCount: -1 } }
    );
  }

  // Update post comments count
  await mongoose.model('Post').updateOne(
    { _id: this.post },
    { $inc: { commentsCount: -1 } }
  );
});

module.exports = mongoose.model('Comment', commentSchema);