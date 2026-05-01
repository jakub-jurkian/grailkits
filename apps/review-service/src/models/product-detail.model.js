const mongoose = require('mongoose');

const productDetailSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  longDescription: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return v && v.length >= 20;
      },
      message: 'longDescription must be at least 20 characters.',
    },
  },
  specs: {
    type: Map,
    of: String,
    default: {},
    validate: {
      validator: function (v) {
        // specs must not exceed 20 keys to prevent abuse
        return v.size <= 20;
      },
      message: 'specs map must not contain more than 20 keys.',
    },
  },
  gallery: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        // every gallery entry must look like a URL
        const urlPattern = /^https?:\/\/.+/;
        return arr.every((item) => urlPattern.test(item));
      },
      message: 'All gallery entries must be valid http/https URLs.',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProductDetail', productDetailSchema);
