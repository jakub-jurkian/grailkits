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
  comment: { 
    type: String, 
    trim: true, 
    maxlength: 500 
  }
}, { 
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);