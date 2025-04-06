const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  midnightId: {
    type: String,
    required: true,
    unique: true
  },
  ingredients: [{
    type: String,
    required: true
  }],
  packagingDetails: {
    materials: [String],
    recyclable: Boolean,
    description: String
  },
  carbonFootprint: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    details: {
      manufacturing: {
        score: Number,
        explanation: String
      },
      transportation: {
        score: Number,
        explanation: String
      },
      packaging: {
        score: Number,
        explanation: String
      },
      lifecycle: {
        score: Number,
        explanation: String
      }
    },
    overallExplanation: String
  },
  similarProducts: [{
    name: String,
    price: Number,
    imageUrl: String,
    ingredients: [String],
    packaging: {
      materials: [String],
      recyclable: Boolean
    },
    source: String,
    link: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema); 