const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { analyzeProduct, findSimilarProducts, calculateCarbonFootprint, answerProductQuestion } = require('../services/productService');
const { authenticate } = require('../middleware/auth');

// Analyze product route
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!name || !price || !imageUrl) {
      return res.status(400).json({ message: 'Name, price, and image URL are required' });
    }

    // Create new product with user reference
    const product = new Product({
      name,
      description,
      price,
      imageUrl,
      analyzedBy: userId,
      analysisResults: {
        ecoScore: Math.floor(Math.random() * 100), // Replace with actual analysis
        carbonFootprint: Math.floor(Math.random() * 1000),
        recommendations: ['Use eco-friendly packaging', 'Reduce plastic usage']
      }
    });

    await product.save();

    res.status(201).json({
      message: 'Product analyzed successfully',
      product
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ 
      message: 'Failed to analyze product', 
      error: error.message 
    });
  }
});

// Get products for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const products = await Product.find({ analyzedBy: userId })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Add this new route before module.exports
router.post('/:id/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        message: 'Question is required' 
      });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }
    
    const answer = await answerProductQuestion(product, question);
    
    res.json({ 
      answer,
      productId: product._id,
      question
    });
  } catch (error) {
    console.error('Error in product chat:', error);
    res.status(500).json({ 
      message: 'Error processing chat request',
      error: error.message 
    });
  }
});

// Create a new product
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id; // Get the user ID from the authenticated request

    const product = new Product({
      name,
      description,
      analyzedBy: userId // Set the analyzedBy field
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

module.exports = router; 