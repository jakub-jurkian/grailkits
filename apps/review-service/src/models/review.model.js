const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    required: true, 
    index: true // indexing makes searching faster
  },
  userId: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
    validate: {
      validator: function(v) {
        // simple validator: disallow HTML tags and script markers
        if (!v) return false;
        return !(/[<>]|<script\b/i.test(v));
      },
      message: 'Body contains forbidden characters or HTML.'
    }
  },
  status: {
    type: String,
    required: true,
    default: 'PENDING',
    enum: ['PENDING', 'APPROVED', 'REJECTED']
  }
  ,
  moderationHistory: [{
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      required: true
    },
    moderatorId: { type: String },
    reason: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true
});

// Compound index to speed up recent reviews per product and aggregation by rating
reviewSchema.index({ productId: 1, createdAt: -1 });

// Pre-save hook: append an entry to moderationHistory when status changes (including initial save)
reviewSchema.pre('save', function(next) {
  try {
    if (this.isNew || this.isModified('status')) {
      this.moderationHistory = this.moderationHistory || [];
      const last = this.moderationHistory.length
        ? this.moderationHistory[this.moderationHistory.length - 1].status
        : null;

      if (last !== this.status) {
        this.moderationHistory.push({ status: this.status, createdAt: new Date() });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Review', reviewSchema);