const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Analyze product using Gemini API
async function analyzeProduct(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Fetch image data
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(imageResponse.data);
    
    // Generate content from image
    const result = await model.generateContent([
      "Analyze this product image and provide the following information in JSON format: name, ingredients list, packaging materials, and whether the packaging is recyclable.",
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.toString('base64')
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw error;
  }
}

// Find similar products using web scraping
async function findSimilarProducts(productName, price) {
  try {
    // This is a placeholder for web scraping logic
    // You'll need to implement the actual scraping logic based on the target websites
    const similarProducts = [];
    
    // Example scraping logic (to be implemented)
    // const response = await axios.get(`https://example.com/search?q=${encodeURIComponent(productName)}`);
    // const $ = cheerio.load(response.data);
    // $('.product-item').each((i, element) => {
    //   similarProducts.push({
    //     name: $(element).find('.name').text(),
    //     price: parseFloat($(element).find('.price').text()),
    //     imageUrl: $(element).find('img').attr('src')
    //   });
    // });
    
    return similarProducts.slice(0, 15); // Return top 15 similar products
  } catch (error) {
    console.error('Error finding similar products:', error);
    throw error;
  }
}

// Calculate carbon footprint using Gemini API
async function calculateCarbonFootprint(productAnalysis) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Calculate the carbon footprint score (0-100) for a product with the following details:
    Ingredients: ${productAnalysis.ingredients.join(', ')}
    Packaging: ${productAnalysis.packaging.materials.join(', ')}
    Recyclable: ${productAnalysis.packaging.recyclable}
    
    Provide the response in JSON format with the following structure:
    {
      "score": number,
      "details": {
        "manufacturing": number,
        "transportation": number,
        "packaging": number,
        "lifecycle": number
      }
    }`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    throw error;
  }
}

module.exports = {
  analyzeProduct,
  findSimilarProducts,
  calculateCarbonFootprint
}; 