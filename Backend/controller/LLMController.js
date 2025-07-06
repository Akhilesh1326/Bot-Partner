const connectDB = require('../ConnectDB');
const client = connectDB.connectToPostgresSQL();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extracts product names from Gemini's plain text response
 * @param {string} rawText - LLM response
 * @returns {string[]} array of product names
 */
function extractProductNamesFromLLM(rawText) {
    if (typeof rawText !== 'string') {
        throw new Error('Expected string input from LLM');
    }

    return rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const namePart = line.split(',')[0];
            return namePart.replace(/^\d+\.\s*/, ''); // remove number prefix
        });
}

/**
 * Sends a prompt to Gemini model and returns list of product names
 * @param {string} productName - name of the main product
 * @param {string|number} price - price of the main product
 * @param {string[]} dataToBeNotIncluded - products to exclude
 * @returns {Promise<string[]>}
 */
async function getSuggestions(productName, price, dataToBeNotIncluded) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `A user added the following product to their cart:
Product: ${productName} | Price: ${price}$ 

Recommend exactly 5 complementary products that pair well with this item.

Format your response as a clean numbered list:
1. Product Name, Price
2. ...
3. ...
4. ...
5. ...

Only list product name, price. Do not include descriptions, explanations, or extra text.
Last instruction: Do not include these products in your recommendation: ${dataToBeNotIncluded.join(', ')}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("LLM Output:\n", text);

    return extractProductNamesFromLLM(text);
}

/**
 * Fetch complementary products from DB based on LLM suggestions
 * @param {string} productName
 * @param {string|number} price
 * @returns {Promise<Object[]>} Array of product rows from DB
 */
async function fetchProducts(productName, price) {
    let productToSuggestion = [];
    let dataToBeNotIncluded = [];
    let foundCount = 0;

    while (foundCount < 3) {
        const productArray = await getSuggestions(productName, price, dataToBeNotIncluded);

        try {
            for (let i = 0; i < productArray.length; i++) {
                const suggestedName = productArray[i];
                const resp = await client.query(`SELECT * FROM products WHERE name = $1`, [suggestedName]);

                if (resp.rows.length > 0) {
                    const alreadyAdded = productToSuggestion.some(
                        item => item.name === resp.rows[0].name
                    );

                    if (!alreadyAdded) {
                        console.log("✅ Found product in DB:", resp.rows[0].name);
                        productToSuggestion.push(resp.rows[0]);
                        foundCount++;
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error querying product from DB:", error);
        }

        dataToBeNotIncluded = [...dataToBeNotIncluded, ...productArray];

        if (dataToBeNotIncluded.length > 25) {
            console.warn("⚠️ Too many retries, exiting with available suggestions");
            break;
        }
    }

    return productToSuggestion;
}

/**
 * Ask LLM to extract product names from the recommendation text
 * @param {string} recommendationText - The original LLM recommendation response
 * @param {string[]|Object[]} itemList - The original items that were bought (to exclude from extraction)
 * @returns {Promise<string[]>} Array of product names extracted by LLM
 */
async function extractProductNamesWithLLM(recommendationText, itemList = []) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convert itemList to array of item names for exclusion
    const itemNames = Array.isArray(itemList) 
        ? itemList.map(item => typeof item === 'string' ? item : item.name || item.title || JSON.stringify(item))
        : [];
    
    const prompt = `From the following recommendation text, extract ONLY the specific product names that are being SUGGESTED or RECOMMENDED (not the ones already purchased).

Rules:
1. Extract only concrete product names that are being SUGGESTED/RECOMMENDED (like "Greek Yogurt", "Peanut Butter", "Honey", "Granola")
2. Do NOT include generic terms (like "fruits", "vegetables", "accessories")
3. Do NOT include recipe names or cooking methods
4. Focus on products that can be bought from a store
5. EXCLUDE any products that are already in the user's purchase list
6. Return exactly 5-10 product names maximum

IMPORTANT: DO NOT extract these items as they are already purchased by the user:
${itemNames.length > 0 ? itemNames.map((item, index) => `${index + 1}. ${item}`).join('\n') : 'None'}

Format your response as a clean numbered list:
1. Product Name 1
2. Product Name 2
3. Product Name 3
...

Only extract SUGGESTED/RECOMMENDED product names, no descriptions or explanations.

Recommendation text to analyze:
${recommendationText}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log("Product extraction LLM output:\n", text);
        
        // Parse the numbered list response
        const productNames = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.match(/^\d+\./))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(name => name.length > 0);
        
        // Additional filtering to remove any items that might match the purchased items
        const filteredProductNames = productNames.filter(productName => {
            const lowerProductName = productName.toLowerCase();
            return !itemNames.some(itemName => {
                const lowerItemName = itemName.toLowerCase();
                return lowerProductName.includes(lowerItemName) || lowerItemName.includes(lowerProductName);
            });
        });
        
        return filteredProductNames;
    } catch (error) {
        console.error("Error extracting product names with LLM:", error);
        return [];
    }
}

/**
 * Search for products in database
 * @param {string[]} productNames - Array of product names to search for
 * @returns {Promise<Object[]>} Array of matching products from database
 */
async function searchProductsInDB(productNames) {
    const foundProducts = [];
    
    for (const productName of productNames) {
        try {
            // Try exact match first (by name)
            let resp = await client.query(`SELECT * FROM products WHERE LOWER(name) = LOWER($1)`, [productName]);
            
            // If no exact match, try partial match in name
            if (resp.rows.length === 0) {
                resp = await client.query(`SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1)`, [`%${productName}%`]);
            }
            
            // If still no match, try searching in description
            if (resp.rows.length === 0) {
                resp = await client.query(`SELECT * FROM products WHERE LOWER(description) LIKE LOWER($1)`, [`%${productName}%`]);
            }
            
            // If still no match, try searching in both name and description with OR condition
            if (resp.rows.length === 0) {
                resp = await client.query(`
                    SELECT * FROM products 
                    WHERE LOWER(name) LIKE LOWER($1) 
                    OR LOWER(description) LIKE LOWER($1)
                    LIMIT 5
                `, [`%${productName}%`]);
            }
            
            if (resp.rows.length > 0) {
                // Add all found products (up to 3 per search term to avoid too many results)
                const productsToAdd = resp.rows.slice(0, 3);
                
                for (const product of productsToAdd) {
                    // Avoid duplicates
                    const alreadyAdded = foundProducts.some(
                        item => item.id === product.id
                    );
                    
                    if (!alreadyAdded) {
                        console.log("✅ Found product in DB:");
                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        console.log(`📦 Product Name: ${product.name}`);
                        console.log(`🆔 Product ID: ${product.id}`);
                        console.log(`💰 Price: ${product.price}`);
                        console.log(`📂 Category: ${product.category || 'N/A'}`);
                        console.log(`📝 Description: ${product.description || 'N/A'}`);
                        console.log(`🔍 Search Term: ${productName}`);
                        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        
                        foundProducts.push(product);
                    }
                }
            } else {
                console.log(`❌ Product not found in DB: ${productName}`);
            }
        } catch (error) {
            console.error("❌ Error querying product from DB:", error);
        }
    }
    
    return foundProducts;
}

const fetchRecommendationsForItemsList = async (itemList) => {
    // Basic input validation
    if (!itemList || (Array.isArray(itemList) && itemList.length === 0) || (typeof itemList === 'string' && itemList.trim() === '')) {
        throw new Error("Item list cannot be empty");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // First LLM call - Generate comprehensive recommendations
        const recommendationPrompt = `I have a list of items that a user has bought from an e-commerce website. Each item belongs to one of the following categories: **Electronics, Food, or Clothing/Fashion**. For each item or group of related items:

1. **If the item is from the *****Electronics***** category**:
   * Provide **use cases**, **smart usage tips**, **relevant accessories**, and **benefits of owning the product**.
   * Suggest **complementary products** that enhance the user's experience (e.g., if it's a laptop, recommend a cooling pad, mouse, or productivity tools).
   * If possible, highlight **trends** or **new technology** that relates to the item.

2. **If the item is from the *****Food***** category**:
   * Share **healthy recipes** that include or use the item.
   * Provide **calorie count**, **nutritional benefits**, and **any health tips**.
   * Suggest **storage tips**, **pairing items** (e.g., what goes well with it), or **similar healthier alternatives**.
   * Mention specific product names like "Greek Yogurt", "Peanut Butter", "Honey", "Granola", "Oats", etc.

3. **If the item is from the *****Clothing/Fashion***** category**:
   * Recommend **occasions or seasons** where this clothing fits best.
   * Suggest **matching items or accessories** to complete the outfit.
   * Provide **styling tips**, **current trends**, and **fashion advice** based on the item's type and color.

4. If the item list contains **items from multiple categories**, also:
   * Try to find any **cross-category connections or lifestyle patterns** (e.g., someone who bought gym clothes and protein bars might also be interested in a fitness smartwatch).
   * Recommend **bundle offers**, **lifestyle tips**, or **personalized ideas** that span across these categories.

Use a friendly yet informative tone that educates and engages the user. The goal is to help them **make the most of their purchases**, discover **related items**, and **enhance their lifestyle**.

Here is the item list: ${JSON.stringify(itemList, null, 2)}`;

        const result = await model.generateContent(recommendationPrompt);
        const recommendationText = result.response.text();

        console.log("LLM Recommendation Output:\n", recommendationText);

        // Second LLM call - Extract product names from the recommendation (excluding already purchased items)
        const extractedProductNames = await extractProductNamesWithLLM(recommendationText, itemList);
        console.log("Extracted product names:", extractedProductNames);

        // Search for products in database
        const foundProducts = await searchProductsInDB(extractedProductNames);
        
        if (foundProducts.length > 0) {
            console.log(`\n🎯 FINAL RECOMMENDED PRODUCTS FOR USER (${foundProducts.length} found):`);
            console.log("═══════════════════════════════════════════════════════════════");
            foundProducts.forEach((product, index) => {
                console.log(`\n${index + 1}. ${product.name}`);
                console.log(`   💰 Price: ${product.price}`);
                console.log(`   📂 Category: ${product.category || 'N/A'}`);
                console.log(`   📝 Description: ${product.description || 'No description available'}`);
                console.log(`   📊 Stock: ${product.stock || 'N/A'}`);
                console.log(`   ⭐ Rating: ${product.rating || 'N/A'}`);
                console.log(`   🏷️ Brand: ${product.brand || 'N/A'}`);
            });
            console.log("═══════════════════════════════════════════════════════════════");
        } else {
            console.log("❌ No products found in database to recommend");
        }

        // Return results
        return {
            recommendations: recommendationText,
            suggestedProducts: foundProducts.length > 0 ? foundProducts : [], // Only return products if found
            totalProductsFound: foundProducts.length
        };

    } catch (error) {
        console.error("Error generating recommendations:", error);
        throw new Error("Failed to generate recommendations");
    }
};



const chatLLm = async (message, cartItems) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format cart items for better context
    const cartItemsContext = cartItems.map(item => 
        `${item.name} - ${item.price} x${item.quantity}`
    ).join(', ');

    // Get existing cart item names to exclude from recommendations
    const existingCartItems = cartItems.map(item => item.name);

    const recommendationPrompt = `
User message: "${message}"
Current cart items: ${cartItemsContext}

Based on the user's message and their current cart items, recommend exactly 5 complementary products that would fulfill their request or pair well with their current items.

Format your response as a clean numbered list with product name and estimated price:
1. Product Name, Price
2. Product Name, Price
3. Product Name, Price
4. Product Name, Price
5. Product Name, Price

Only list product name and price. Do not include descriptions, explanations, or extra text.
Last instruction: Do not include these products in your recommendation: ${existingCartItems.join(', ')}
`;

    try {
        const result = await model.generateContent(recommendationPrompt);
        const recommendationText = result.response.text();

        console.log("LLM Recommendation Output:\n", recommendationText);

        // Extract product names using the provided function
        const productNames = extractProductNamesFromLLM(recommendationText);
        console.log("Extracted Product Names:", productNames);

        // Validate products against database (single attempt only)
        const validatedProducts = await validateProducts(productNames, existingCartItems);

        return {
            llmResponse: recommendationText,
            extractedProducts: productNames,
            validatedProducts: validatedProducts,
            // Return only the products found in database
            recomendations: validatedProducts // This matches your UI expectation
        };

    } catch (error) {
        console.error("Error in chatLLm:", error);
        throw error;
    }
};

/**
 * Extracts product names from Gemini's plain text response
 * @param {string} rawText - LLM response
 * @returns {string[]} array of product names
 */
function extractProductNamesFromLLM(rawText) {
    if (typeof rawText !== 'string') {
        throw new Error('Expected string input from LLM');
    }

    return rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const namePart = line.split(',')[0];
            return namePart.replace(/^\d+\.\s*/, ''); // remove number prefix
        });
}

/**
 * Validates products against database (single attempt only)
 * @param {string[]} productNames - Array of product names to validate
 * @param {string[]} existingCartItems - Items already in cart to exclude
 * @returns {Promise<Object[]>} Array of validated products from database with complete details
 */
async function validateProducts(productNames, existingCartItems = []) {
    let validatedProducts = [];
    let dataToBeNotIncluded = [...existingCartItems];

    console.log("🔍 Starting product validation with", productNames.length, "products");

    // Validate the extracted products (one attempt only)
    for (const productName of productNames) {
        const foundProduct = await searchProductInDatabase(productName);
        if (foundProduct && !isProductAlreadyIncluded(foundProduct, validatedProducts, dataToBeNotIncluded)) {
            console.log("✅ Found product in DB:", foundProduct.name);
            validatedProducts.push(foundProduct);
        }
        dataToBeNotIncluded.push(productName);
    }

    console.log(`📊 Final result: Found ${validatedProducts.length} products in database`);
    return validatedProducts;
}

/**
 * Searches for a product in the database using multiple strategies
 * Returns complete product details from database
 * @param {string} productName - Product name to search for
 * @returns {Promise<Object|null>} Complete product object if found, null otherwise
 */
async function searchProductInDatabase(productName) {
    try {
        console.log(`🔍 Searching for product: "${productName}"`);
        
        // Extract keywords first
        const keywords = extractKeywords(productName);
        console.log(`🔑 Extracted keywords for "${productName}":`, keywords);
        
        let resp = null;
        
        // Try exact match first (by name)
        resp = await client.query(`SELECT * FROM products WHERE LOWER(name) = LOWER($1)`, [productName]);
        
        // If no exact match, try partial match in name
        if (resp.rows.length === 0) {
            resp = await client.query(`SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1)`, [`%${productName}%`]);
        }
        
        // If still no match, try reverse partial match (database name contains search term)
        if (resp.rows.length === 0) {
            resp = await client.query(`SELECT * FROM products WHERE LOWER($1) LIKE LOWER('%' || name || '%')`, [productName]);
        }
        
        // If still no match, try searching in description
        if (resp.rows.length === 0) {
            resp = await client.query(`SELECT * FROM products WHERE LOWER(description) LIKE LOWER($1)`, [`%${productName}%`]);
        }
        
        // If still no match, try keyword-based search
        if (resp.rows.length === 0) {
            console.log(`🔍 Trying keyword search for "${productName}"`);
            
            for (const keyword of keywords) {
                if (keyword.length >= 3) { // Only search meaningful keywords
                    resp = await client.query(`
                        SELECT * FROM products 
                        WHERE LOWER(name) LIKE LOWER($1) 
                        OR LOWER(description) LIKE LOWER($1)
                        OR LOWER(summary) LIKE LOWER($1)
                        ORDER BY 
                            CASE 
                                WHEN LOWER(name) LIKE LOWER($1) THEN 1
                                WHEN LOWER(description) LIKE LOWER($1) THEN 2
                                WHEN LOWER(summary) LIKE LOWER($1) THEN 3
                                ELSE 4
                            END
                        LIMIT 1
                    `, [`%${keyword}%`]);
                    
                    if (resp.rows.length > 0) {
                        console.log(`✅ Found product using keyword "${keyword}":`, resp.rows[0].name);
                        break;
                    }
                }
            }
        }
        
        if (resp && resp.rows.length > 0) {
            const product = resp.rows[0];
            console.log(`✅ Product found in database:`, {
                id: product.id,
                name: product.name,
                price: product.price
            });
            
            // Return complete product details
            return {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price) || 0,
                description: product.description || '',
                summary: product.summary || '',
                image: product.image || product.image_url || `https://via.placeholder.com/200x200/007bff/ffffff?text=${encodeURIComponent(product.name)}`,
                category: product.category || '',
                subcategory: product.subcategory || '',
                brand: product.brand || '',
                stock: product.stock || 0,
                rating: product.rating || 4.0,
                reviews: product.reviews || 0,
                created_at: product.created_at,
                updated_at: product.updated_at,
                // Add any other fields from your database schema
                ...product // Spread all other fields from database
            };
        }
        
        console.log(`❌ Product not found in database: "${productName}"`);
        return null;
        
    } catch (error) {
        console.error(`❌ Error searching for product "${productName}":`, error.message);
        return null;
    }
}

/**
 * Checks if a product is already included in the results or exclusion list
 * @param {Object} product - Product to check
 * @param {Object[]} validatedProducts - Already validated products
 * @param {string[]} exclusionList - Products to exclude
 * @returns {boolean} True if product should be excluded
 */
function isProductAlreadyIncluded(product, validatedProducts, exclusionList) {
    // Check if already in validated products by ID
    const alreadyValidated = validatedProducts.some(item => item.id === product.id);
    
    // Check if product name is in exclusion list
    const inExclusionList = exclusionList.some(excluded => 
        excluded.toLowerCase() === product.name.toLowerCase()
    );
    
    return alreadyValidated || inExclusionList;
}

/**
 * Function to extract meaningful keywords from product names
 * @param {string} productName - Product name to extract keywords from
 * @returns {string[]} Array of keywords sorted by relevance
 */
const extractKeywords = (productName) => {
    // Remove common words and split into keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'set', 'pack', 'piece', 'item'];
    
    const keywords = productName
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .split(/\s+/) // Split by whitespace
        .filter(word => word.length >= 3 && !commonWords.includes(word)) // Filter meaningful words
        .sort((a, b) => b.length - a.length); // Sort by length (longer words first)
    
    return keywords;
};

/**
 * API endpoint function to get recommendations
 * This should be called from your Express route
 */
const getRecommendationsAPI = async (req, res) => {
    try {
        const { productName, price, cartItems = [] } = req.body || req.query;
        
        if (!productName) {
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }

        console.log(`📝 Getting recommendations for: "${productName}" with price: ${price}`);
        
        // Create a message for the LLM
        const message = `I just added "${productName}" ($${price}) to my cart. What other products would go well with this?`;
        
        // Get recommendations using the existing function
        const result = await chatLLm(message, cartItems);
        
        return res.json({
            success: true,
            message: 'Recommendations retrieved successfully',
            recomendations: result.validatedProducts, // Only database products
            totalFound: result.validatedProducts.length,
            llmSuggestions: result.extractedProducts.length
        });
        
    } catch (error) {
        console.error('Error in getRecommendationsAPI:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = { fetchProducts, fetchRecommendationsForItemsList, chatLLm};
