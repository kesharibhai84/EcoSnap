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
    
    // Generate content from image with a more structured prompt
    const result = await model.generateContent([
      {
        text: `You are a product analysis AI. Analyze the given product image and return ONLY a JSON object with the following structure, no other text:
{
  "name": "product name",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "packaging": {
    "materials": ["material1", "material2", ...],
    "recyclable": true/false
  }
}`
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData.toString('base64')
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text().trim();
    
    // Ensure we have valid JSON by extracting it from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing product:', error);
    if (error instanceof SyntaxError) {
      console.error('Raw response:', text);
      throw new Error('Failed to parse product analysis response');
    }
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Calculate the carbon footprint score (0-100) for a product with the following details:
    Ingredients: ${productAnalysis.ingredients.join(', ')}
    Packaging: ${productAnalysis.packaging.materials.join(', ')}
    Recyclable: ${productAnalysis.packaging.recyclable}
    
    Provide the response in JSON format with the following structure, no other text:
    {
      "score": number,
      "details": {
        "manufacturing": number,
        "transportation": number,
        "packaging": number,
        "lifecycle": number
      }
    }`;
    
    const result = await model.generateContent([
      {
        text: prompt
      }
    ]);
    
    const response = await result.response;
    const text = response.text().trim();
    
    // Ensure we have valid JSON by extracting it from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    if (error instanceof SyntaxError) {
      console.error('Raw response:', text);
      throw new Error('Failed to parse carbon footprint response');
    }
    throw error;
  }
}

module.exports = {
  analyzeProduct,
  findSimilarProducts,
  calculateCarbonFootprint
}; 