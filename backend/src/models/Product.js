const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
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
      manufacturing: Number,
      transportation: Number,
      packaging: Number,
      lifecycle: Number
    }
  },
  similarProducts: [{
    name: String,
    price: Number,
    imageUrl: String,
    carbonFootprint: Number
  }],
  analyzedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysisResults: {
    ecoScore: {
      type: Number,
      default: 0
    },
    carbonFootprint: {
      type: Number,
      default: 0
    },
    recommendations: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 