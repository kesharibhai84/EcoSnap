const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to scrape product details from various sources
async function scrapeProductDetails(productName) {
  try {
    // Array of potential sources to scrape
    const sources = [
      {
        url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '#feature-bullets .a-list-item, #productDetails_techSpec_section_1 .prodDetAttrValue, #productDetails_db_sections .content',
          productInfo: '#productDescription p, #feature-bullets .a-list-item',
          packaging: '#important-information .a-section, #sustainability-section'
        }
      },
      {
        url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '._2418kt, ._3nUwn8, .RmoJUa',
          productInfo: '._1mXcCf, ._2-riNZ',
          packaging: '._2-N8zT, ._1UhVsV'
        }
      },
      {
        url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '.product-ingredients-content, .product-description p',
          productInfo: '.product-description, .product-overview',
          packaging: '.product-overview p'
        }
      },
      {
        url: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '.pd-ingredient-content, .mt-20 p',
          productInfo: '.pd-description-content, .pd-about-content',
          packaging: '.pd-about-content'
        }
      },
      {
        url: `https://www.1mg.com/search/all?name=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '.DrugOverview__description___1Jwqq, .ProductDescription__description-content___A_qCZ',
          productInfo: '.DrugOverview__content___22ZBX, .ProductDescription__description-content___A_qCZ',
          packaging: '.PackSizeLabel__pack-size___3jScl'
        }
      },
      {
        url: `https://incidecoder.com/search?query=${encodeURIComponent(productName)}`,
        selectors: {
          ingredients: '.ingredients-list, .ingred-list',
          productInfo: '.product-description',
          packaging: '.product-details'
        }
      }
    ];

    let scrapedData = {
      ingredients: [],
      packaging: {
        materials: [],
        recyclable: false
      },
      additionalInfo: []
    };

    for (const source of sources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);

        // Extract ingredients
        $(source.selectors.ingredients).each((_, element) => {
          const text = $(element).text().trim();
          if (text && !scrapedData.ingredients.includes(text)) {
            scrapedData.ingredients.push(text);
          }
        });

        // Extract product info
        $(source.selectors.productInfo).each((_, element) => {
          const text = $(element).text().trim();
          if (text && !scrapedData.additionalInfo.includes(text)) {
            scrapedData.additionalInfo.push(text);
          }
        });

        // Extract packaging info
        $(source.selectors.packaging).each((_, element) => {
          const text = $(element).text().trim().toLowerCase();
          if (text.includes('recycl')) {
            scrapedData.packaging.recyclable = true;
          }
          if (text.includes('plastic') || text.includes('cardboard') || text.includes('glass')) {
            const materials = text.match(/(plastic|cardboard|glass|metal|paper)/g);
            if (materials) {
              scrapedData.packaging.materials.push(...materials);
            }
          }
        });

        if (scrapedData.ingredients.length > 0) {
          break; // Stop if we found ingredients from one source
        }
      } catch (error) {
        console.error(`Error scraping from ${source.url}:`, error.message);
        continue; // Try next source if one fails
      }
    }

    return scrapedData;
  } catch (error) {
    console.error('Error in web scraping:', error);
    return null;
  }
}

// Analyze product using Gemini API and web scraping
async function analyzeProduct(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // First get basic product info from image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(imageResponse.data);
    
    const result = await model.generateContent([
      {
        text: `Analyze this product image and provide ONLY the product name and brand in JSON format:
{
  "name": "full product name",
  "brand": "brand name"
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
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    const basicInfo = JSON.parse(jsonMatch[0]);
    
    // Get detailed product info through web scraping
    const scrapedData = await scrapeProductDetails(basicInfo.name);
    
    // If web scraping failed or didn't find ingredients, use Gemini as fallback
    if (!scrapedData || scrapedData.ingredients.length === 0) {
      console.log('Web scraping failed or no ingredients found, using Gemini analysis as fallback');
      const detailResult = await model.generateContent([
        {
          text: `Analyze this product image and list its likely ingredients and packaging materials in JSON format:
{
  "ingredients": ["ingredient1", "ingredient2"],
  "packaging": {
    "materials": ["material1", "material2"],
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
      
      const detailResponse = await detailResult.response;
      const detailText = detailResponse.text().trim();
      const detailJson = JSON.parse(detailText.match(/\{[\s\S]*\}/)[0]);
      
      return {
        name: basicInfo.name,
        brand: basicInfo.brand,
        ingredients: detailJson.ingredients,
        packaging: detailJson.packaging
      };
    }
    
    // Combine image analysis with scraped data
    return {
      name: basicInfo.name,
      brand: basicInfo.brand,
      ingredients: scrapedData.ingredients,
      packaging: scrapedData.packaging,
      additionalInfo: scrapedData.additionalInfo
    };
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw error;
  }
}

// Find similar products using web scraping
async function findSimilarProducts(productName, price) {
  try {
    const priceRange = {
      min: price * 0.7,
      max: price * 1.3
    };

    // Get detailed product categorization and characteristics
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const categoryResult = await model.generateContent([
      {
        text: `Given the product name "${productName}", return ONLY a JSON object with detailed product categorization. For example, if the product is "Clinic Plus Strong & Long Health Shampoo", return:
{
  "mainCategory": "Hair Care",
  "subCategory": "Shampoo",
  "productType": "Hair Strengthening Shampoo",
  "targetUse": ["hair fall control", "hair strengthening", "long hair"],
  "searchTerms": ["anti hair fall shampoo", "strengthening shampoo"],
  "excludeTerms": ["hair oil", "hair color", "conditioner"],
  "keyCharacteristics": ["strengthening", "long hair", "anti hair fall"]
}`
      }
    ]);
    
    const categoryText = categoryResult.response.text().trim();
    const categoryJson = JSON.parse(categoryText.match(/\{[\s\S]*\}/)[0]);

    const sources = [
      {
        url: `https://www.amazon.in/s?k=${encodeURIComponent(categoryJson.productType)}&rh=n:${getCategoryId(categoryJson.mainCategory)}`,
        selectors: {
          products: '.s-result-item[data-component-type="s-search-result"]',
          name: 'h2 .a-link-normal',
          price: '.a-price-whole',
          image: '.s-image',
          link: 'h2 .a-link-normal',
          brand: '.a-size-base.a-color-secondary',
          description: '.a-size-base-plus'
        }
      },
      {
        url: `https://www.flipkart.com/search?q=${encodeURIComponent(categoryJson.productType)}`,
        selectors: {
          products: '._1AtVbE',
          name: '._4rR01T',
          price: '._30jeq3',
          image: '._396cs4',
          link: '._1fQZEK',
          brand: '._2WkVRV',
          description: '._1xgFaf'
        }
      },
      {
        url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(categoryJson.productType)}`,
        selectors: {
          products: '.product-list-box',
          name: '.product-name',
          price: '.price-box',
          image: '.product-image img',
          link: '.product-list-box a',
          brand: '.brand-name',
          description: '.product-description'
        }
      }
    ];

    // Also search using specific search terms
    const searchTermSources = categoryJson.searchTerms.map(term => sources.map(source => ({
      ...source,
      url: source.url.replace(encodeURIComponent(categoryJson.productType), encodeURIComponent(term))
    }))).flat();

    // Combine all sources
    const allSources = [...sources, ...searchTermSources];
    let similarProducts = new Map();

    // Function to check if a product matches the target characteristics
    function matchesCharacteristics(productName, productDescription) {
      const text = (productName + ' ' + productDescription).toLowerCase();
      
      // Check if product contains any exclude terms
      if (categoryJson.excludeTerms.some(term => text.includes(term.toLowerCase()))) {
        return false;
      }

      // Count how many key characteristics match
      const matchingCharacteristics = categoryJson.keyCharacteristics.filter(char => 
        text.includes(char.toLowerCase())
      );

      // Product should match at least 2 key characteristics or target uses
      const matchingUses = categoryJson.targetUse.filter(use => 
        text.includes(use.toLowerCase())
      );

      return (matchingCharacteristics.length + matchingUses.length) >= 2;
    }

    for (const source of allSources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);

        $(source.selectors.products).each((_, element) => {
          const priceText = $(element).find(source.selectors.price).text()
            .replace(/[^0-9.]/g, '');
          const productPrice = parseFloat(priceText);

          if (productPrice >= priceRange.min && productPrice <= priceRange.max) {
            const productName = $(element).find(source.selectors.name).text().trim();
            const productDescription = $(element).find(source.selectors.description).text().trim();
            
            // Only add product if it matches the characteristics
            if (matchesCharacteristics(productName, productDescription)) {
              const productLink = $(element).find(source.selectors.link).attr('href');
              const fullUrl = productLink?.startsWith('http') ? productLink : 
                new URL(productLink || '', source.url).toString();
              
              const brand = $(element).find(source.selectors.brand).text().trim();
              
              if (!similarProducts.has(fullUrl)) {
                similarProducts.set(fullUrl, {
                  name: productName,
                  brand: brand || 'Unknown Brand',
                  price: productPrice,
                  imageUrl: $(element).find(source.selectors.image).attr('src'),
                  url: fullUrl,
                  source: new URL(source.url).hostname,
                  description: productDescription
                });
              }
            }
          }
        });
      } catch (error) {
        console.error(`Error scraping from ${source.url}:`, error.message);
        continue;
      }
    }

    // Convert Map to array and sort by relevance and price similarity
    let productsArray = Array.from(similarProducts.values());
    productsArray.sort((a, b) => {
      // First sort by number of matching characteristics
      const aMatches = categoryJson.keyCharacteristics.filter(char => 
        (a.name + ' ' + a.description).toLowerCase().includes(char.toLowerCase())
      ).length;
      const bMatches = categoryJson.keyCharacteristics.filter(char => 
        (b.name + ' ' + b.description).toLowerCase().includes(char.toLowerCase())
      ).length;

      if (aMatches !== bMatches) {
        return bMatches - aMatches;
      }

      // If same number of matches, sort by price similarity
      const aDiff = Math.abs(a.price - price);
      const bDiff = Math.abs(b.price - price);
      return aDiff - bDiff;
    });

    // Get top 15 most relevant products
    productsArray = productsArray.slice(0, 15);

    // Rest of the function (fetching ingredients and eco scores) remains the same
    for (const product of productsArray) {
      try {
        const scrapedData = await scrapeProductDetails(product.name);
        if (scrapedData && scrapedData.ingredients.length > 0) {
          product.ingredients = scrapedData.ingredients;
          product.packaging = scrapedData.packaging;
          product.additionalInfo = scrapedData.additionalInfo;
        } else {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const imageResponse = await axios.get(product.imageUrl, { responseType: 'arraybuffer' });
          const imageData = Buffer.from(imageResponse.data);
          
          const result = await model.generateContent([
            {
              text: `Analyze this product image and list its likely ingredients and packaging materials in JSON format:
{
  "ingredients": ["ingredient1", "ingredient2"],
  "packaging": {
    "materials": ["material1", "material2"],
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
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            product.ingredients = analysis.ingredients;
            product.packaging = analysis.packaging;
          }
        }

        const carbonFootprint = await calculateCarbonFootprint({
          ingredients: product.ingredients || [],
          packaging: product.packaging || { materials: [], recyclable: false }
        });
        product.ecoScore = carbonFootprint.score;
        
      } catch (error) {
        console.error(`Error analyzing similar product ${product.name}:`, error.message);
        product.ingredients = ['Ingredients information unavailable'];
        product.ecoScore = null;
      }
    }

    return productsArray;
  } catch (error) {
    console.error('Error finding similar products:', error);
    throw error;
  }
}

// Helper function to get category IDs for better filtering
function getCategoryId(category) {
  const categoryMap = {
    'Hair Care': '1374407031',
    'Skin Care': '1374408031',
    'Personal Care': '1374279031',
    'Beauty': '1355016031',
    'Health Care': '1350384031'
    // Add more categories as needed
  };
  return categoryMap[category] || '';
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