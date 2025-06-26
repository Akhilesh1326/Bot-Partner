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
 * @param {string[]} dataToBeNotIncluded - products to exclude
 * @returns {Promise<string[]>}
 */
async function getSuggestions(dataToBeNotIncluded) {
    const productName = 'Coconut Oil';
    const price = '7.99';

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
 * @returns {Promise<Object[]>} Array of product rows from DB
 */
async function fetchProducts() {
    let productToSuggestion = [];
    let dataToBeNotIncluded = [];
    let foundCount = 0;

    while (foundCount < 3) {
        const productArray = await getSuggestions(dataToBeNotIncluded);

        try {
            for (let i = 0; i < productArray.length; i++) {
                const productName = productArray[i];
                const resp = await client.query(`SELECT * FROM products WHERE name = $1`, [productName]);

                if (resp.rows.length > 0) {
                    const alreadyAdded = productToSuggestion.some(
                        item => item.name === resp.rows[0].name
                    );

                    if (!alreadyAdded) {
                        console.log("Found product in DB:", resp.rows[0].name);
                        productToSuggestion.push(resp.rows[0]);
                        foundCount++;
                    }
                }
            }
        } catch (error) {
            console.error(" Error querying product from DB:", error);
        }

        dataToBeNotIncluded = [...dataToBeNotIncluded, ...productArray];

        if (dataToBeNotIncluded.length > 25) {
            console.warn(" Too many retries, exiting with available suggestions");
            break;
        }
    }

    return productToSuggestion;
}

module.exports = { fetchProducts };
