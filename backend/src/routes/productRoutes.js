const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { analyzeProduct, findSimilarProducts, calculateCarbonFootprint, answerProductQuestion } = require('../services/productService');
const midnightService = require('../services/midnightService');

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
    
    // Store sensitive data in Midnight
    const sensitiveData = {
      ingredients: productAnalysis.ingredients,
      packagingDetails: productAnalysis.packaging,
      carbonFootprint: {
        score: carbonFootprint.score,
        details: {
          manufacturing: carbonFootprint.details.manufacturing,
          transportation: carbonFootprint.details.transportation,
          packaging: carbonFootprint.details.packaging,
          lifecycle: carbonFootprint.details.lifecycle
        },
        overallExplanation: carbonFootprint.overallExplanation
      }
    };

    const midnightResult = await midnightService.storeProductData(sensitiveData);
    
    // Create new product with Midnight reference
    const product = new Product({
      name: productAnalysis.name,
      imageUrl,
      price,
      midnightId: midnightResult.midnightId,
      similarProducts
    });
    
    await product.save();
    
    res.status(201).json({
      ...product.toObject(),
      midnightProof: midnightResult.proof
    });
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

// Get product by ID with Midnight data
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Retrieve sensitive data from Midnight
    const sensitiveData = await midnightService.retrieveProductData(product.midnightId);
    
    res.json({
      ...product.toObject(),
      ...sensitiveData
    });
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

// Get detailed similar products by product ID
router.get('/:id/similar-products', async (req, res) => {
  try {
    // Find the product by ID
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the product already has similar products
    if (product.similarProducts && product.similarProducts.length > 0) {
      // Return existing similar products with all details
      return res.json({
        productId: product._id,
        productName: product.name,
        similarProductsCount: product.similarProducts.length,
        similarProducts: product.similarProducts
      });
    }
    
    // If no similar products yet, find them
    const similarProducts = await findSimilarProducts(product.name, product.price);
    
    // Update the product with found similar products
    product.similarProducts = similarProducts;
    await product.save();
    
    // Return the full detailed response
    res.json({
      productId: product._id,
      productName: product.name,
      similarProductsCount: similarProducts.length,
      similarProducts: similarProducts
    });
    
  } catch (error) {
    console.error('Error finding similar products:', error);
    res.status(500).json({ 
      message: 'Error finding similar products',
      error: error.message 
    });
  }
});

// Get detailed similar products by direct search (no need to save)
router.get('/similar-products/details', async (req, res) => {
  try {
    const { name, price } = req.query;
    
    // Validate required parameters
    if (!name) {
      return res.status(400).json({ 
        message: 'Product name is required in query parameters' 
      });
    }
    
    // Parse price or use default if not provided
    const productPrice = price ? parseFloat(price) : 100;
    
    console.log(`Searching for detailed similar products to "${name}" with price around ${productPrice}`);
    
    // Find similar products with all details
    const similarProducts = await findSimilarProducts(name, productPrice);
    
    // Return comprehensive response with all details
    res.json({
      query: {
        productName: name,
        productPrice: productPrice
      },
      count: similarProducts.length,
      similarProducts: similarProducts.map(product => ({
        name: product.name,
        price: product.price,
        source: product.source,
        imageUrl: product.imageUrl,
        link: product.link,
        ingredients: product.ingredients || [],
        packaging: {
          materials: product.packaging?.materials || [],
          recyclable: product.packaging?.recyclable || false
        }
      }))
    });
  } catch (error) {
    console.error('Error finding similar products details:', error);
    res.status(500).json({ 
      message: 'Error finding similar products details',
      error: error.message 
    });
  }
});

module.exports = router; 