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

// Find similar products using web scraping from multiple sources
// async function findSimilarProducts(productName, price) {
//   try {
//     // Define proxy headers from environment variables (if any)
//     const proxyHeaders = {
//       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
//                     'AppleWebKit/537.36 (KHTML, like Gecko) ' +
//                     'Chrome/91.0.4472.124 Safari/537.36',
//       'Proxy-Authorization': process.env.PROXY_AUTH || '',
//       'X-Proxy-Header': process.env.PROXY_HEADER || ''
//     };

//     // List of sources with search URLs, baseUrl, and CSS selectors
//     const sources = [
//       {
//         name: 'Amazon India',
//         url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
//         baseUrl: 'https://www.amazon.in',
//         selectors: {
//           item: '.s-result-item',
//           name: 'h2.a-size-mini',
//           price: '.a-price-whole',
//           // Use 'img.s-image' and fallback to data-old-hires or data-src if available
//           image: 'img.s-image',
//           link: 'a.a-link-normal.s-no-outline'
//         }
//       },
//       // {
//       //   name: 'Flipkart',
//       //   url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.flipkart.com',
//       //   selectors: {
//       //     item: 'div._1AtVbE',
//       //     name: 'div._4rR01T',
//       //     price: 'div._30jeq3._1_WHN1',
//       //     image: 'img._396cs4',
//       //     link: 'a._1fQZEK'
//       //   }
//       // },
//       // {
//       //   name: 'Walmart',
//       //   url: `https://www.walmart.com/search/?query=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.walmart.com',
//       //   selectors: {
//       //     item: 'div.search-result-gridview-item',
//       //     name: 'a.product-title-link span',
//       //     price: 'span.price-main span.visuallyhidden',
//       //     image: 'img',
//       //     link: 'a.product-title-link'
//       //   }
//       // },
//       // {
//       //   name: 'eBay',
//       //   url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.ebay.com',
//       //   selectors: {
//       //     item: '.s-item',
//       //     name: '.s-item__title',
//       //     price: '.s-item__price',
//       //     image: '.s-item__image-img',
//       //     link: '.s-item__link'
//       //   }
//       // },
//       // {
//       //   name: 'BestBuy',
//       //   url: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.bestbuy.com',
//       //   selectors: {
//       //     item: '.sku-item',
//       //     name: '.sku-header a',
//       //     price: '.priceView-customer-price span',
//       //     image: '.product-image',
//       //     link: '.sku-header a'
//       //   }
//       // },
//       // {
//       //   name: 'Target',
//       //   url: `https://www.target.com/s?searchTerm=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.target.com',
//       //   selectors: {
//       //     item: 'li.h-padding-h-tight',
//       //     name: 'a[data-test="product-title"]',
//       //     price: 'span[data-test="current-price"]',
//       //     image: 'img',
//       //     link: 'a[data-test="product-title"]'
//       //   }
//       // },
//       // {
//       //   name: 'AliExpress',
//       //   url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.aliexpress.com',
//       //   selectors: {
//       //     item: '.list-item',
//       //     name: '.item-title',
//       //     price: '.price-current',
//       //     image: 'img',
//       //     link: 'a'
//       //   }
//       // },
//       // {
//       //   name: 'Nykaa',
//       //   url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.nykaa.com',
//       //   selectors: {
//       //     item: '.css-11z3l4a',
//       //     name: '.css-1d0jf8e',
//       //     price: '.css-14gy7wr',
//       //     image: 'img',
//       //     link: 'a'
//       //   }
//       // },
//       // {
//       //   name: 'BigBasket',
//       //   url: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.bigbasket.com',
//       //   selectors: {
//       //     item: '.uiv2-cmn-prd-item',
//       //     name: '.uiv2-cmn-prd-name',
//       //     price: '.uiv2-cmn-prd-price',
//       //     image: 'img',
//       //     link: 'a'
//       //   }
//       // },
//       // {
//       //   name: '1mg',
//       //   url: `https://www.1mg.com/search/all?name=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://www.1mg.com',
//       //   selectors: {
//       //     item: '.style__list-item___3HqOP',
//       //     name: '.style__product-name___3lGzS',
//       //     price: '.style__price___1fz1k',
//       //     image: 'img',
//       //     link: 'a'
//       //   }
//       // },
//       // {
//       //   name: 'Incidecoder',
//       //   url: `https://incidecoder.com/search?query=${encodeURIComponent(productName)}`,
//       //   baseUrl: 'https://incidecoder.com',
//       //   selectors: {
//       //     item: '.product-card',
//       //     name: '.product-card-title',
//       //     price: '.product-card-price',
//       //     image: 'img',
//       //     link: 'a'
//       //   }
//       // }
//     ];

//     let aggregatedProducts = [];

//     // Prepare query tokens for filtering similar products
//     const tokens = productName
//       .toLowerCase()
//       .split(/\s+/)
//       .filter(token => token.length > 2); // filter out very short words

//     for (const source of sources) {
//       try {
//         const response = await axios.get(source.url, { headers: proxyHeaders });
//         const $ = require('cheerio').load(response.data);
//         $(source.selectors.item).each((i, element) => {
//           const title = $(element).find(source.selectors.name).text().trim();
//           const priceText = $(element).find(source.selectors.price).text().trim();
//           const priceMatch = priceText.match(/[\d,.]+/);
//           const productPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
          
//           // Extract image URL with additional fallback attributes for Amazon
//           let imageUrl = $(element).find(source.selectors.image).attr('src') ||
//                          $(element).find(source.selectors.image).attr('data-old-hires') ||
//                          $(element).find(source.selectors.image).attr('data-src');
          
//           // Extract link; if relative, prepend baseUrl.
//           let productLink = $(element).find(source.selectors.link).attr('href');
//           if (productLink && productLink.startsWith('/')) {
//             productLink = source.baseUrl + productLink;
//           }

//           // Filter to include only products that match the query tokens
//           const lowerTitle = title.toLowerCase();
//           const isSimilar = tokens.every(token => lowerTitle.includes(token));

//           if (isSimilar && title && productPrice !== null && productLink) {
//             aggregatedProducts.push({
//               source: source.name,
//               name: title,
//               price: productPrice,
//               imageUrl,
//               link: productLink
//             });
//           }
//         });
//       } catch (error) {
//         console.error(`Error scraping from ${source.name}:`, error.message);
//         continue;
//       }
//     }

//     // Optionally, further filter by price if needed.
//     return aggregatedProducts.slice(0, 15);
//   } catch (error) {
//     console.error('Error finding similar products:', error);
//     throw error;
//   }
// }

// Assuming genAI is already initialized earlier in your code
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function findSimilarProducts(productName, price) {
  try {
    // Define proxy headers (if needed)
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
          item: '.s-result-item',
          name: 'h2.a-size-mini',
          price: '.a-price-whole',
          // Try standard src and fallback attributes
          image: 'img.s-image',
          link: 'a.a-link-normal.s-no-outline'
        }
      },
      {
        name: 'Flipkart',
        url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`,
        baseUrl: 'https://www.flipkart.com',
        selectors: {
          item: 'div._1AtVbE',
          name: 'div._4rR01T',
          price: 'div._30jeq3._1_WHN1',
          image: 'img._396cs4',
          link: 'a._1fQZEK'
        }
      },
      {
        name: 'Walmart',
        url: `https://www.walmart.com/search/?query=${encodeURIComponent(productName)}`,
        baseUrl: 'https://www.walmart.com',
        selectors: {
          item: 'div.search-result-gridview-item',
          name: 'a.product-title-link span',
          price: 'span.price-main span.visuallyhidden',
          image: 'img',
          link: 'a.product-title-link'
        }
      },
      {
        name: 'eBay',
        url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(productName)}`,
        baseUrl: 'https://www.ebay.com',
        selectors: {
          item: '.s-item',
          name: '.s-item__title',
          price: '.s-item__price',
          image: '.s-item__image-img',
          link: '.s-item__link'
        }
      }
      // Add more sources if desired...
    ];

    let aggregatedProducts = [];
    // Tokenize product name for filtering similar results
    const tokens = productName
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 2);

    for (const source of sources) {
      try {
        const response = await axios.get(source.url, { headers: proxyHeaders });
        const $ = cheerio.load(response.data);
        $(source.selectors.item).each((i, element) => {
          const title = $(element).find(source.selectors.name).text().trim();
          const priceText = $(element).find(source.selectors.price).text().trim();
          const priceMatch = priceText.match(/[\d,.]+/);
          const productPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
          // Try multiple attributes for image URL
          let imageUrl =
            $(element).find(source.selectors.image).attr('src') ||
            $(element).find(source.selectors.image).attr('data-old-hires') ||
            $(element).find(source.selectors.image).attr('data-src');
          let productLink = $(element).find(source.selectors.link).attr('href');
          if (productLink && productLink.startsWith('/')) {
            productLink = source.baseUrl + productLink;
          }
          const lowerTitle = title.toLowerCase();
          const isSimilar = tokens.every(token => lowerTitle.includes(token));
          if (isSimilar && title && productPrice !== null && productLink && imageUrl) {
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
        // Continue to next source if one fails.
      }
    }

    // Use Gemini fallback if no valid similar products are found.
    if (aggregatedProducts.length === 0) {
      console.log('No similar products found via scraping; using Gemini API fallback.');
      return await findSimilarProductsViaGemini(productName, price);
    }
    return aggregatedProducts.slice(0, 15);
  } catch (error) {
    console.error('Error finding similar products:', error);
    return await findSimilarProductsViaGemini(productName, price);
  }
}

/**
 * Fallback function that queries Gemini API for similar products.
 * Expects the API to return a JSON array of objects with name, price, imageUrl, and link.
 */
async function findSimilarProductsViaGemini(productName, price) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Find at least 10 similar products for "${productName}" with an approximate price of ${price}.
Return the results as a JSON array of objects. Each object should have the keys: "name", "price", "imageUrl", and "link".
Ensure that the output is valid JSON using double quotes for all property names and string values.`;

    const result = await model.generateContent([{ text: prompt }]);
    const response = await result.response;
    const text = response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Gemini API response');
    }

    let products;
    try {
      products = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing Gemini JSON:', parseError);
      console.error('Raw Gemini response:', text);
      try {
        const fixedText = jsonMatch[0].replace(/'/g, '"');
        products = JSON.parse(fixedText);
      } catch (err) {
        throw new Error('Failed to parse Gemini API fallback response');
      }
    }

    if (!Array.isArray(products) || products.length < 10) {
        console.warn("Gemini API returned less than 10 products.");
    }

    return products;
  } catch (error) {
    console.error('Error in Gemini API for similar products:', error);
    return [];
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