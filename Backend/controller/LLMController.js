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
 * @returns {Promise<string[]>} Array of product names extracted by LLM
 */
async function extractProductNamesWithLLM(recommendationText) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `From the following recommendation text, extract ONLY the specific product names that could be found in an e-commerce database.

Rules:
1. Extract only concrete product names (like "Greek Yogurt", "Peanut Butter", "Honey", "Granola")
2. Do NOT include generic terms (like "fruits", "vegetables", "accessories")
3. Do NOT include recipe names or cooking methods
4. Focus on products that can be bought from a store
5. Return exactly 5-10 product names maximum

Format your response as a clean numbered list:
1. Product Name 1
2. Product Name 2
3. Product Name 3
...

Only product names, no descriptions or explanations.

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
        
        return productNames;
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
            // Try exact match first
            let resp = await client.query(`SELECT * FROM products WHERE LOWER(name) = LOWER($1)`, [productName]);
            
            // If no exact match, try partial match
            if (resp.rows.length === 0) {
                resp = await client.query(`SELECT * FROM products WHERE LOWER(name) LIKE LOWER($1)`, [`%${productName}%`]);
            }
            
            if (resp.rows.length > 0) {
                // Avoid duplicates
                const alreadyAdded = foundProducts.some(
                    item => item.name === resp.rows[0].name
                );
                
                if (!alreadyAdded) {
                    const product = resp.rows[0];
                    console.log("✅ Found product in DB:");
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.log(`📦 Product Name: ${product.name}`);
                    console.log(`🆔 Product ID: ${product.id}`);
                    console.log(`💰 Price: ${product.price}`);
                    console.log(`📂 Category: ${product.category || 'N/A'}`);
                    console.log(`📝 Description: ${product.description || 'N/A'}`);
                    console.log(`📊 Stock: ${product.stock || 'N/A'}`);
                    console.log(`⭐ Rating: ${product.rating || 'N/A'}`);
                    console.log(`🏷️ Brand: ${product.brand || 'N/A'}`);
                    console.log(`🖼️ Image URL: ${product.image_url || 'N/A'}`);
                    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    
                    foundProducts.push(product);
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

        // Second LLM call - Extract product names from the recommendation
        const extractedProductNames = await extractProductNamesWithLLM(recommendationText);
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


module.exports = { fetchProducts, fetchRecommendationsForItemsList };
