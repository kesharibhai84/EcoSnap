const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { analyzeProduct, findSimilarProducts, calculateCarbonFootprint } = require('../services/productService');

// Upload and analyze a new product
router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl, price } = req.body;
    
    // Analyze product using Gemini API
    const productAnalysis = await analyzeProduct(imageUrl);
    
    // Find similar products
    const similarProducts = await findSimilarProducts(productAnalysis.name, price);
    
    // Calculate carbon footprint
    const carbonFootprint = await calculateCarbonFootprint(productAnalysis);
    
    // Create new product
    const product = new Product({
      name: productAnalysis.name,
      imageUrl,
      price,
      ingredients: productAnalysis.ingredients,
      packagingDetails: productAnalysis.packaging,
      carbonFootprint,
      similarProducts
    });
    
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ message: 'Error analyzing product' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
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

module.exports = router; 