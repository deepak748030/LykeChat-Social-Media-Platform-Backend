const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'Software Development',
      'Marketing',
      'Design',
      'Writing',
      'Photography',
      'Video Editing',
      'Tutoring',
      'Fitness',
      'Beauty',
      'Repair',
      'Cleaning',
      'Delivery',
      'Consulting',
      'Other'
    ]
  },
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      required: true
    },
    minPrice: {
      type: Number,
      min: 0
    },
    maxPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['online', 'onsite', 'both'],
      default: 'both'
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [{
    type: String
  }],
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    timeSlots: [{
      start: String, // Format: "HH:MM"
      end: String    // Format: "HH:MM"
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
serviceSchema.index({ provider: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ 'location.coordinates': '2dsphere' });
serviceSchema.index({ 'rating.average': -1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ isActive: 1, isFeatured: -1 });

// Methods
serviceSchema.methods.addReview = async function(userId, rating, comment = '') {
  // Check if user already reviewed
  const existingReview = this.rating.reviews.find(
    review => review.user.toString() === userId.toString()
  );

  if (existingReview) {
    return false; // Already reviewed
  }

  this.rating.reviews.push({
    user: userId,
    rating,
    comment
  });

  // Recalculate average rating
  const totalRating = this.rating.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.rating.reviews.length;
  this.rating.count = this.rating.reviews.length;

  await this.save();
  return true;
};

serviceSchema.methods.getPriceRange = function() {
  const { type, minPrice, maxPrice, currency } = this.pricing;
  
  if (type === 'negotiable') {
    return 'Negotiable';
  }
  
  if (type === 'fixed') {
    return `${currency} ${minPrice}`;
  }
  
  return `${currency} ${minPrice}-${maxPrice}`;
};

module.exports = mongoose.model('Service', serviceSchema);