const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cheerio = require('cheerio');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to scrape product details from various sources
async function scrapeProductDetails(productName) {
  try {
    // Array of potential sources to scrape
    // here use gemini api to find ingredients and packaging of the productName and store in the below scrapedData

    // Use Gemini API to get product details
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this product: "${productName}"
    
    Provide detailed information about:
    1. List of ingredients/materials used
    2. Packaging materials used
    3. Whether the packaging is recyclable
    
    Format the response in JSON:
    {
      "ingredients": ["ingredient1", "ingredient2", ...],
      "packaging": {
        "materials": ["material1", "material2", ...],
        "recyclable": true/false
      }
    }
    
    Be specific and realistic with the ingredients and materials.`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    const text = response.text().trim();

    let scrapedData = {
      ingredients: [],
      packaging: {
        materials: [],
        recyclable: false
      },
      additionalInfo: []
    };

    try {
      // Clean the response text by removing markdown code block syntax
      const cleanedText = text
        .replace(/```json\n?|\n?```/g, '')
        .replace(/\n/g, ' ')
        .trim();
      
      // Try to parse the JSON response
      let geminiData;
      try {
        geminiData = JSON.parse(cleanedText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Cleaned text:', cleanedText);
        
        // Try to extract JSON-like content using regex
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            geminiData = JSON.parse(jsonMatch[0]);
          } catch (retryError) {
            console.error('Failed to parse extracted JSON:', retryError);
            // Return default data instead of throwing error
            return scrapedData;
          }
        } else {
          // Return default data instead of throwing error
          return scrapedData;
        }
      }
      
      // Update scrapedData with Gemini response
      scrapedData.ingredients = Array.isArray(geminiData.ingredients) ? geminiData.ingredients : [];
      
      // Log the response for debugging
      console.log('Gemini API Response:', {
        ingredients: scrapedData.ingredients,
        rawResponse: cleanedText
      });
      
      return scrapedData;
    } catch (parseError) {
      console.error('Error processing Gemini response:', parseError);
      console.error('Raw response:', text);
      // Return default data instead of throwing error
      return scrapedData;
    }
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
    // Get both scraped and Gemini products
    const [scrapedProducts, geminiProducts] = await Promise.all([
      findSimilarProductsViaScraping(productName, price),
      findSimilarProductsViaGemini(productName, price)
    ]);

    // Combine and deduplicate products
    const allProducts = [...scrapedProducts, ...geminiProducts];
    const uniqueProducts = [];
    const seenNames = new Set();

    for (const product of allProducts) {
      if (!seenNames.has(product.name.toLowerCase())) {
        seenNames.add(product.name.toLowerCase());
        const productWithScores = {
          ...product,
          dataSource: product.source || 'Gemini',
          scrapedData: product.source ? {
            ingredients: product.ingredients,
            packaging: product.packaging
          } : null,
          geminiData: !product.source ? {
            ingredients: product.ingredients,
            packaging: product.packaging
          } : null
        };
        
        // Calculate environmental scores
        const scores = await calculateEnvironmentalScores(productWithScores);
        productWithScores.carbonFootprint = scores;
        
        uniqueProducts.push(productWithScores);
      }
    }

    return uniqueProducts;
  } catch (error) {
    console.error('Error finding similar products:', error);
    return [];
  }
}

// Separate scraping function
async function findSimilarProductsViaScraping(productName, price) {
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

    // List of sources to scrape
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
    const tokens = productName.toLowerCase().split(/\s+/).filter(token => token.length > 2);
    const minPrice = price - 500;
    const maxPrice = price + 500;
    const seenProducts = new Set();

    for (const source of sources) {
      try {
        console.log(`Searching on ${source.name} for ${productName}`);
        const response = await axios.get(source.url, { 
          headers: proxyHeaders,
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        $(source.selectors.item).each((i, element) => {
          const title = $(element).find(source.selectors.name).text().trim();
          if (!title || seenProducts.has(title.toLowerCase())) return;
          
          const priceText = $(element).find(source.selectors.price).text().trim();
          const priceMatch = priceText.match(/[\d,.]+/);
          const productPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
          
          if (!productPrice || productPrice < minPrice || productPrice > maxPrice) return;
          
          let imageUrl = $(element).find(source.selectors.image).attr('src') ||
                        $(element).find(source.selectors.image).attr('data-old-hires') ||
                        $(element).find(source.selectors.image).attr('data-src') ||
                        $(element).find('img').attr('src');
          
          let productLink = $(element).find(source.selectors.link).attr('href');
          if (productLink && productLink.startsWith('/')) {
            productLink = source.baseUrl + productLink;
          }
          
          const lowerTitle = title.toLowerCase();
          const isSimilar = tokens.some(token => lowerTitle.includes(token));
          
          if (isSimilar && title && productPrice && productLink) {
            seenProducts.add(lowerTitle);
            
            if (!imageUrl) {
              imageUrl = 'https://via.placeholder.com/150?text=No+Image';
            }
            
            aggregatedProducts.push({
              source: source.name,
              name: title,
              price: productPrice,
              imageUrl,
              link: productLink,
              ingredients: ['Not available'],
              packaging: {
                materials: ['Not specified'],
                recyclable: false
              }
            });
          }
        });
      } catch (error) {
        console.error(`Error scraping from ${source.name}: ${error.message}`);
        continue;
      }
    }
    
    return aggregatedProducts;
  } catch (error) {
    console.error('Error in scraping function:', error);
    return [];
  }
}

// Update findSimilarProductsViaGemini with retry logic
async function findSimilarProductsViaGemini(productName, price) {
  try {
    return await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Step 1: Get diverse product names from Gemini
      const minPrice = price - 500;
      const maxPrice = price + 500;
      
      const prompt = `List atleast 15 DIFFERENT similar products to "${productName}" with prices strictly between ${minPrice} and ${maxPrice} only.
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
              
              
              // Extract packaging info
              const packagingMaterials = [];
              const packagingSelectors = [
                '#important-information .a-section',
                '#sustainability-section',
                '#productDetails_techSpec_section_1 .prodDetAttrValue',
                '#productOverview_feature_div .a-section'
              ];
              
              let isRecyclable = false;
              
              
              
              // Create product with all details needed for carbon footprint calculation
              similarProducts.push({
                source: 'Amazon India',
                name: name,
                price: productPrice,
                imageUrl: imageUrl,
                link: productLink,
                ingredients: await (async () => {
                  let attempts = 3;
                  let ingredients;
                  while (attempts > 0 && !ingredients) {
                    try {
                      const data = await scrapeProductDetails(name);
                      ingredients = data?.ingredients;
                      if (ingredients) break;
                    } catch (err) {
                      console.error(`Attempt ${4-attempts} failed:`, err);
                    }
                    attempts--;
                  }
                  return ingredients || ['Not available'];
                })(),
              });
              
              console.log(`AAAAAASuccessfully found complete details for: ${name}`, similarProducts);
            } catch (pageError) {
              console.error(`Error scraping product page for ${name}: ${pageError.message}`);
              // Fallback: Use scrapeProductDetails to get the ingredients
              let fallbackIngredients = await scrapeProductDetails(name).then(data => data?.ingredients);
              try {
                const scrapedDataFallback = await scrapeProductDetails(name);
                if (
                  scrapedDataFallback &&
                  scrapedDataFallback.ingredients &&
                  scrapedDataFallback.ingredients.length > 0
                ) {
                  fallbackIngredients = scrapedDataFallback.ingredients;
                }
              } catch (fallbackError) {
                console.error('Error in fallback scrapeProductDetails:', fallbackError);
              }
              // Still add the product with basic details, but now with ingredients from fallback
              similarProducts.push({
                source: 'Amazon India',
                name: name,
                price: productPrice,
                imageUrl: imageUrl,
                link: productLink,
                ingredients: fallbackIngredients,
                packaging: {
                  materials: ['Not specified'],
                  recyclable: false
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error scraping details for ${productNameFromGemini}: ${error.message}`);
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

// Add this new function before module.exports
async function calculateComparativeScores(products) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze these products and provide a comparative analysis of their environmental impact scores (0-100, lower is better):

${products.map((p, i) => `
Product ${i + 1}:
- Name: ${p.name}
- Ingredients: ${p.ingredients.join(', ')}
- Packaging: ${p.packaging?.materials?.join(', ')}
- Recyclable: ${p.packaging?.recyclable}
`).join('\n')}

Provide the response in JSON format with this exact structure:
{
  "products": [
    {
      "name": "product name",
      "scores": {
        "manufacturing": number,
        "transportation": number,
        "packaging": number,
        "lifecycle": number
      },
      "explanation": "brief explanation of the scores"
    }
  ]
}`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Update each product with its scores
    return products.map(product => {
      const productAnalysis = analysis.products.find(p => p.name === product.name);
      if (productAnalysis) {
        return {
          ...product,
          carbonFootprint: {
            score: Math.round(
              (productAnalysis.scores.manufacturing + 
               productAnalysis.scores.transportation + 
               productAnalysis.scores.packaging + 
               productAnalysis.scores.lifecycle) / 4
            ),
            details: {
              manufacturing: {
                score: productAnalysis.scores.manufacturing,
                explanation: productAnalysis.explanation
              },
              transportation: {
                score: productAnalysis.scores.transportation,
                explanation: productAnalysis.explanation
              },
              packaging: {
                score: productAnalysis.scores.packaging,
                explanation: productAnalysis.explanation
              },
              lifecycle: {
                score: productAnalysis.scores.lifecycle,
                explanation: productAnalysis.explanation
              }
            }
          }
        };
      }
      return product;
    });
  } catch (error) {
    console.error('Error calculating comparative scores:', error);
    return products;
  }
}

// Add this new function before module.exports
async function calculateEnvironmentalScores(product) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this product and calculate its environmental impact scores (0-100, lower is better):

Product Information:
- Name: ${product.name}
- Ingredients: ${product.ingredients?.join(', ') || 'Not available'}
- Packaging Materials: ${product.packaging?.materials?.join(', ') || 'Not available'}
- Recyclable: ${product.packaging?.recyclable || 'Not specified'}

Calculate scores for:
1. Manufacturing Impact (based on production complexity and resource intensity)
2. Transportation Impact (based on weight and fragility of materials)
3. Packaging Impact (based on packaging materials and recyclability)
4. Lifecycle Impact (based on decomposition time and environmental persistence)

Provide the response in JSON format with this exact structure:
{
  "scores": {
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
  }
}`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Calculate overall eco score as average of all scores
    const scores = analysis.scores;
    const ecoScore = Math.round(
      (scores.manufacturing.score + 
       scores.transportation.score + 
       scores.packaging.score + 
       scores.lifecycle.score) / 4
    );

    return {
      score: ecoScore,
      details: scores
    };
  } catch (error) {
    console.error('Error calculating environmental scores:', error);
    return {
      score: 50,
      details: {
        manufacturing: { score: 50, explanation: "No data available" },
        transportation: { score: 50, explanation: "No data available" },
        packaging: { score: 50, explanation: "No data available" },
        lifecycle: { score: 50, explanation: "No data available" }
      }
    };
  }
}

module.exports = {
  analyzeProduct,
  findSimilarProducts,
  calculateCarbonFootprint,
  answerProductQuestion,
  chatWithProduct,
  calculateComparativeScores,
  calculateEnvironmentalScores
};
