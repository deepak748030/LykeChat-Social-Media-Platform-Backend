const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Advertisement title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Advertisement description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Advertisement image is required']
  },
  link: {
    type: String,
    required: [true, 'Advertisement link is required']
  },
  type: {
    type: String,
    enum: ['banner', 'sponsored_post', 'video', 'carousel'],
    default: 'banner'
  },
  targetAudience: {
    ageRange: {
      min: { type: Number, min: 13, max: 100 },
      max: { type: Number, min: 13, max: 100 }
    },
    interests: [String],
    location: {
      countries: [String],
      states: [String],
      cities: [String]
    }
  },
  budget: {
    type: {
      type: String,
      enum: ['cpc', 'cpm', 'daily'],
      default: 'cpm'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  metrics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    spend: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
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
advertisementSchema.index({ status: 1, priority: -1 });
advertisementSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
advertisementSchema.index({ 'targetAudience.interests': 1 });
advertisementSchema.index({ createdAt: -1 });

// Virtual for CTR (Click Through Rate)
advertisementSchema.virtual('ctr').get(function() {
  return this.metrics.impressions > 0 ? (this.metrics.clicks / this.metrics.impressions) * 100 : 0;
});

// Methods
advertisementSchema.methods.recordImpression = async function() {
  this.metrics.impressions++;
  await this.save();
};

advertisementSchema.methods.recordClick = async function() {
  this.metrics.clicks++;
  await this.save();
};

advertisementSchema.methods.recordConversion = async function() {
  this.metrics.conversions++;
  await this.save();
};

advertisementSchema.methods.isScheduleActive = function() {
  const now = new Date();
  return now >= this.schedule.startDate && now <= this.schedule.endDate;
};

module.exports = mongoose.model('Advertisement', advertisementSchema);