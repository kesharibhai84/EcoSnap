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

// Add this retry logic to handle Gemini API fetch failures
async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait longer between each retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Update analyzeProduct with retry logic
async function analyzeProduct(imageUrl) {
  try {
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageData = Buffer.from(imageResponse.data);

      const result = await model.generateContent([
        {
          text: `Analyze this product image and provide ONLY the product name, brand, and a one-line description in JSON format:
{
  "name": "full product name",
  "brand": "brand name",
  "description": "brief one-line description of what this product is (e.g., 'Herbal hair oil with coconut extracts', 'Digital fitness watch with heart rate monitor')"
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
      console.log("Basic product info:", basicInfo);

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
          description: basicInfo.description,
          ingredients: detailJson.ingredients,
          packaging: detailJson.packaging
        };
      }

      return {
        name: basicInfo.name,
        brand: basicInfo.brand,
        description: basicInfo.description,
        ingredients: scrapedData.ingredients,
        packaging: scrapedData.packaging
      };
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw error;
  }
}

// Find similar products using web scraping from multiple sources
async function findSimilarProducts(productName, price) {
  try {
    // Define proxy headers for scraping
    const proxyHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/91.0.4472.124 Safari/537.36',
      'Proxy-Authorization': process.env.PROXY_AUTH || '',
      'X-Proxy-Header': process.env.PROXY_HEADER || ''
    };

    // List of sources to scrape with selectors and baseUrl for relative links
    const sources = [
      {
        name: 'Amazon India',
        url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
        baseUrl: 'https://www.amazon.in',
        selectors: {
          item: '.s-result-item[data-component-type="s-search-result"]',
          name: 'h2 a.a-link-normal span',
          price: '.a-price .a-offscreen, .a-price-whole',
          image: 'img.s-image',
          link: 'h2 a.a-link-normal'
        }
      },
      {
        name: 'Flipkart',
        url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`,
        baseUrl: 'https://www.flipkart.com',
        selectors: {
          item: 'div._1AtVbE',
          name: 'div._4rR01T, .s1Q9rs',
          price: 'div._30jeq3',
          image: 'img._396cs4',
          link: 'a._1fQZEK, a.s1Q9rs'
        }
      }
    ];

    let aggregatedProducts = [];
    
    // Tokenize product name for filtering similar results
    const tokens = productName
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 2);

    // Define price range (±15%)
    const minPrice = price - 50;
    const maxPrice = price + 50;
    
    // Track seen products to avoid duplicates
    const seenProducts = new Set();
    
    // Search on each source
    for (const source of sources) {
      try {
        console.log(`Searching on ${source.name} for ${productName}`);
        const response = await axios.get(source.url, { 
          headers: proxyHeaders,
          timeout: 10000 // 10 second timeout
        });
        
        const $ = cheerio.load(response.data);
        
        $(source.selectors.item).each((i, element) => {
          // Extract basic product info
          const title = $(element).find(source.selectors.name).text().trim();
          if (!title || seenProducts.has(title.toLowerCase())) return;
          
          const priceText = $(element).find(source.selectors.price).text().trim();
          const priceMatch = priceText.match(/[\d,.]+/);
          const productPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
          
          // Check if price is in range
          if (!productPrice || productPrice < minPrice || productPrice > maxPrice) return;
          
          // Extract image URL
          let imageUrl =
            $(element).find(source.selectors.image).attr('src') ||
            $(element).find(source.selectors.image).attr('data-old-hires') ||
            $(element).find(source.selectors.image).attr('data-src') ||
            $(element).find('img').attr('src');
          
          // Extract product link
          let productLink = $(element).find(source.selectors.link).attr('href');
          if (productLink && productLink.startsWith('/')) {
            productLink = source.baseUrl + productLink;
          }
          
          // Check if this product is similar to the search query
          const lowerTitle = title.toLowerCase();
          const isSimilar = tokens.some(token => lowerTitle.includes(token));
          
          if (isSimilar && title && productPrice && productLink) {
            // Add to seen products set
            seenProducts.add(lowerTitle);
            
            // Handle missing image URL
            if (!imageUrl) {
              imageUrl = 'https://via.placeholder.com/150?text=No+Image';
            }
            
            console.log(`Found similar product: ${title} with price ${productPrice}`);
            
            aggregatedProducts.push({
              source: source.name,
              name: title,
              price: productPrice,
              imageUrl,
              link: productLink
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping from ${source.name}:`, error.message);
        continue; // Try next source if one fails
      }
    }
    
    // Filter to reasonable number and price range
    aggregatedProducts = aggregatedProducts
      .filter(p => p.price >= minPrice && p.price <= maxPrice)
      .slice(0, 8);
    
    // If we found enough products, return them
    if (aggregatedProducts.length >= 3) {
      return aggregatedProducts;
    }
    
    // Fall back to Gemini API if web scraping failed or found too few products
    console.log('Insufficient products found via scraping; using Gemini API fallback.');
    return await findSimilarProductsViaGemini(productName, price);
  } catch (error) {
    console.error('Error finding similar products:', error);
    return await findSimilarProductsViaGemini(productName, price);
  }
}

// Update findSimilarProductsViaGemini with retry logic
async function findSimilarProductsViaGemini(productName, price) {
  try {
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Step 1: Get diverse product names from Gemini
      const minPrice = price - 50;
      const maxPrice = price + 50;
      
      const prompt = `List 15 DIFFERENT similar products to "${productName}" with prices strictly between ${price-50} and ${price+50} only.
Ensure each product is from a different brand or has different features to provide variety.
Only return a simple JSON array of product names. Example:
["Different Product Name 1", "Different Product Name 2", "Different Product Name 3"]`;

      const result = await model.generateContent([{ text: prompt }]);
      const response = await result.response;
      const text = response.text().trim();

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in Gemini API response');
      }

      const productNames = JSON.parse(jsonMatch[0]);
      console.log("Got product names from Gemini:", productNames);

      // Step 2: Web scrape complete details for each product name
      const similarProducts = [];
      const seenProductNames = new Set();
      const proxyHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      for (const productNameFromGemini of productNames) {
        // Skip duplicates
        if (isDuplicateProduct(productNameFromGemini, seenProductNames)) continue;
        seenProductNames.add(productNameFromGemini.toLowerCase());
        
        try {
          // Get basic details from Amazon
          const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(productNameFromGemini)}`;
          const response = await axios.get(searchUrl, { 
            headers: proxyHeaders,
            timeout: 8000
          });
          
          const $ = cheerio.load(response.data);
          const firstResult = $('.s-result-item[data-component-type="s-search-result"]').first();
          
          if (firstResult.length === 0) continue;
          
          // Extract basic product info
          const name = firstResult.find('h2 span').text().trim() || productNameFromGemini;
          const priceText = firstResult.find('.a-price .a-offscreen, .a-price-whole').first().text().trim();
          const priceMatch = priceText.match(/[\d,.]+/);
          const productPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : price;
          
          // Extract image and link
          let imageUrl = firstResult.find('img.s-image').attr('src');
          if (!imageUrl) {
            imageUrl = 'https://via.placeholder.com/150?text=' + encodeURIComponent(name.substring(0, 15));
          }
          
          let productLink = firstResult.find('h2 a.a-link-normal').attr('href');
          if (productLink && productLink.startsWith('/')) {
            productLink = 'https://www.amazon.in' + productLink;
          } else if (!productLink) {
            productLink = searchUrl;
          }
          
          // Step 3: Now get detailed product info for carbon footprint calculation
          // We need to visit the product page to get ingredients, packaging, etc.
          if (productLink) {
            try {
              // Visit product page
              const productResponse = await axios.get(productLink, {
                headers: proxyHeaders,
                timeout: 8000
              });
              
              const productPage = cheerio.load(productResponse.data);
              
              // Extract ingredients (check multiple potential locations)
              const ingredients = [];
              const ingredientSelectors = [
                '#feature-bullets .a-list-item',
                '#productDetails_techSpec_section_1 .prodDetAttrValue',
                '#productDetails_db_sections .content',
                '#productOverview_feature_div .a-section',
                '#important-information .a-section'
              ];
              
              for (const selector of ingredientSelectors) {
                productPage(selector).each((_, el) => {
                  const text = productPage(el).text().trim();
                  // Look for ingredient-like text patterns
                  const ingredientMatches = text.match(/([A-Za-z\s]+(?:acid|oil|extract|butter|powder|wax|vitamin|mineral|protein|water))/g);
                  if (ingredientMatches) {
                    ingredientMatches.forEach(ingredient => {
                      if (!ingredients.includes(ingredient.trim())) {
                        ingredients.push(ingredient.trim());
                      }
                    });
                  }
                });
              }
              
              // Extract packaging info
              const packagingMaterials = [];
              const packagingSelectors = [
                '#important-information .a-section',
                '#sustainability-section',
                '#productDetails_techSpec_section_1 .prodDetAttrValue',
                '#productOverview_feature_div .a-section'
              ];
              
              let isRecyclable = false;
              
              for (const selector of packagingSelectors) {
                productPage(selector).each((_, el) => {
                  const text = productPage(el).text().trim().toLowerCase();
                  if (text.includes('recycl')) {
                    isRecyclable = true;
                  }
                  
                  // Look for packaging materials
                  const materialMatches = text.match(/(plastic|cardboard|glass|metal|paper|aluminum|tin|steel|pet|hdpe|pvc|ldpe|pp|ps)/g);
                  if (materialMatches) {
                    materialMatches.forEach(material => {
                      if (!packagingMaterials.includes(material)) {
                        packagingMaterials.push(material);
                      }
                    });
                  }
                });
              }
              
              // Create product with all details needed for carbon footprint calculation
              similarProducts.push({
                source: 'Amazon India',
                name: name,
                price: productPrice,
                imageUrl: imageUrl,
                link: productLink,
                ingredients: ingredients.length > 0 ? ingredients : ['Not specified'],
                packaging: {
                  materials: packagingMaterials.length > 0 ? packagingMaterials : ['Plastic'],
                  recyclable: isRecyclable
                }
              });
              
              console.log(`Successfully found complete details for: ${name}`);
            } catch (pageError) {
              console.error(`Error scraping product page for ${name}:`, pageError.message);
              // Still add the product with basic details
              similarProducts.push({
                source: 'Amazon India',
                name: name,
                price: productPrice,
                imageUrl: imageUrl,
                link: productLink,
                ingredients: ['Not available'],
                packaging: {
                  materials: ['Not specified'],
                  recyclable: false
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error scraping details for ${productNameFromGemini}:`, error.message);
          // Continue to next product
        }
      }
      
      console.log(`Found ${similarProducts.length} similar products with complete details`);
      return similarProducts;
    });
  } catch (error) {
    console.error('Error in complete similar products function:', error);
    return [];
  }
}

// Helper function to check for duplicate products
function isDuplicateProduct(name, seenNames) {
  const lowerName = name.toLowerCase();
  
  for (const seenName of seenNames) {
    if (lowerName.includes(seenName) || seenName.includes(lowerName)) {
      return true;
    }
    
    // Check for high similarity using word matching
    const nameWords = new Set(lowerName.split(/\s+/).filter(w => w.length > 3));
    const seenWords = new Set(seenName.split(/\s+/).filter(w => w.length > 3));
    
    let matchCount = 0;
    for (const word of nameWords) {
      if (seenWords.has(word)) matchCount++;
    }
    
    if (nameWords.size > 0 && matchCount / nameWords.size > 0.6) {
      return true; // More than 60% word match
    }
  }
  
  return false;
}

// Update calculateCarbonFootprint with retry logic and fallback
async function calculateCarbonFootprint(productAnalysis) {
  try {
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Calculate the carbon footprint for a product with the following details:
      Name: ${productAnalysis.name}
      Description: ${productAnalysis.description || 'N/A'}
    Ingredients: ${productAnalysis.ingredients.join(', ')}
    Packaging: ${productAnalysis.packaging.materials.join(', ')}
    Recyclable: ${productAnalysis.packaging.recyclable}
    
      Perform a COMPARATIVE ANALYSIS against industry standards. Score each category on a scale of 0-100 (lower is better).
      
      Provide the response in JSON format with this exact structure:
    {
      "score": number,
      "details": {
          "manufacturing": {
            "score": number,
            "explanation": "brief explanation"
          },
          "transportation": {
            "score": number,
            "explanation": "brief explanation"
          },
          "packaging": {
            "score": number,
            "explanation": "brief explanation"
          },
          "lifecycle": {
            "score": number,
            "explanation": "brief explanation"
          }
        },
        "overallExplanation": "brief explanation"
      }`;

      const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
    });
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    // Return fallback data when API fails completely
    return {
      score: calculateFallbackScore(productAnalysis),
      details: {
        manufacturing: { 
          score: calculateManufacturingScore(productAnalysis), 
          explanation: "Score calculated from ingredients data (API unavailable)" 
        },
        transportation: { 
          score: 50, 
          explanation: "Average transportation score (API unavailable)" 
        },
        packaging: { 
          score: calculatePackagingScore(productAnalysis), 
          explanation: "Score based on packaging materials and recyclability (API unavailable)" 
        },
        lifecycle: { 
          score: 60, 
          explanation: "Estimated lifecycle impact (API unavailable)" 
        }
      },
      overallExplanation: "Estimated eco-impact score using fallback calculation (API unavailable)"
    };
  }
}

// Fallback functions to calculate scores when API is unavailable
function calculateFallbackScore(productAnalysis) {
  // Calculate a weighted average of component scores
  const manufacturingScore = calculateManufacturingScore(productAnalysis);
  const packagingScore = calculatePackagingScore(productAnalysis);
  
  return Math.round((manufacturingScore * 0.4) + (packagingScore * 0.3) + (50 * 0.3));
}

function calculateManufacturingScore(productAnalysis) {
  // Simple scoring based on ingredient count and known harmful ingredients
  const ingredients = productAnalysis.ingredients || [];
  
  let score = 50; // Default score
  
  // More ingredients generally means higher impact
  if (ingredients.length > 10) score += 15;
  else if (ingredients.length > 5) score += 10;
  else if (ingredients.length <= 3) score -= 10;
  
  // Check for eco-friendly ingredients
  const ecoFriendly = ['natural', 'organic', 'plant', 'vegan', 'eco', 'sustainable'];
  const harmful = ['paraben', 'sulfate', 'phthalate', 'petroleum', 'microplastic', 'synthetic'];
  
  const ingredientsText = ingredients.join(' ').toLowerCase();
  
  ecoFriendly.forEach(term => {
    if (ingredientsText.includes(term)) score -= 5;
  });
  
  harmful.forEach(term => {
    if (ingredientsText.includes(term)) score += 10;
  });
  
  // Ensure score is in valid range
  return Math.max(10, Math.min(90, score));
}

function calculatePackagingScore(productAnalysis) {
  const packaging = productAnalysis.packaging || { materials: [], recyclable: false };
  
  let score = 50; // Default score
  
  // Recyclable packaging is better
  if (packaging.recyclable) score -= 20;
  
  // Different materials have different impacts
  const materials = (packaging.materials || []).join(' ').toLowerCase();
  
  if (materials.includes('plastic')) score += 15;
  if (materials.includes('cardboard') || materials.includes('paper')) score -= 10;
  if (materials.includes('glass')) score -= 5;
  if (materials.includes('aluminum')) score -= 5;
  if (materials.includes('biodegradable')) score -= 15;
  
  // Ensure score is in valid range
  return Math.max(10, Math.min(90, score));
}

// Add this new function before the module.exports
async function answerProductQuestion(product, question) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful product assistant. Answer the following question about this product based ONLY on the provided information. Be concise but informative.

Product Information:
- Name: ${product.name}
- Ingredients: ${product.ingredients.join(', ')}
- Packaging: ${JSON.stringify(product.packagingDetails)}
- Carbon Footprint Score: ${product.carbonFootprint.score}/100
- Environmental Impact Details:
  * Manufacturing Impact: ${product.carbonFootprint.details.manufacturing}/100
  * Transportation Impact: ${product.carbonFootprint.details.transportation}/100
  * Packaging Impact: ${product.carbonFootprint.details.packaging}/100
  * Lifecycle Impact: ${product.carbonFootprint.details.lifecycle}/100

User Question: ${question}

Rules:
1. Only use the information provided above to answer
2. If you can't answer with certainty based on the given information, say so
3. For eco scores, explain the factors that contributed to the score
4. For ingredient-based questions (like "is it vegan?"), analyze the ingredients list
5. Keep answers concise but informative`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error in product chatbot:', error);
    throw error;
  }
}

// Add this new function at the end, before module.exports
async function chatWithProduct(productData, userQuestion) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful product assistant. Answer the following question about this product:

Product Information:
- Name: ${productData.name}
- Ingredients: ${productData.ingredients.join(', ')}
- Packaging: ${JSON.stringify(productData.packagingDetails)}
- Carbon Footprint Score: ${productData.carbonFootprint.score}/100
- Carbon Footprint Details: ${JSON.stringify(productData.carbonFootprint.details)}

User Question: ${userQuestion}

Provide a clear, concise answer based only on the product information provided above. If you cannot answer with certainty based on the given information, say so.`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error in chatbot:', error);
    throw error;
  }
}

module.exports = {
  analyzeProduct,
  findSimilarProducts,
  calculateCarbonFootprint,
  answerProductQuestion,
  chatWithProduct
}; 