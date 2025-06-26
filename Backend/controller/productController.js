const connectDB = require('../ConnectDB');

const client = connectDB.connectToPostgresSQL();


async function getAllCategories() {
    try {
        const response = await client.query(`SELECT * FROM categories`);
        console.log(response.rows);
        if(response.rows.length === 0) return {status: 404, message: "Categories not found"};

        return {status: 200, message: "Categories Found", data: response.rows};

    } catch (error) {
        console.log("Error while getting all categories in controller", error);
        return {status: 500, message: "Internal server error"};
    }
}

async function getCategoryById(id) {
    try {
        const response = await client.query(`SELECT * FROM categories WHERE id = $1`, [id]);

        if (response.rows.length === 0) {
            return { status: 404, message: "No category found by id" };
        }

        return { status: 200, message: "Category found", data: response.rows };
    } catch (error) {
        console.error("Error at getting the category by id in controller:", error);
        return { status: 500, message: "Internal server error" };
    }
}

async function getAllSubCategories(categoryId) {
    try {
        console.log(categoryId)
        const response = await client.query(`SELECT * FROM sub_categories WHERE category_id = $1`,[categoryId]);
        if(response.rows.length === 0) return {status: 404, message: "Sub-category not found"};

        return {status: 200, message: "Sub-category found", data: response.rows};
    } catch (error) {
        console.log("Error while getting sub-category by category id", error);
        return {status: 500, message:"Internal server error"};
    }
}

async function getSubCategoriById(id) {
    try {
        const response = await client.query(`SELECT * FROM sub_categories WHERE id = $1`, [id]);

        if (response.rows.length === 0) {
            return { status: 404, message: "No sub-category found by id" };
        }

        return { status: 200, message: "Sub-Category found", data: response.rows};
    } catch (error) {
        console.error("Error at getting the sub-category by id in controller:", error);
        return { status: 500, message: "Internal server error" };
    }
}

async function getProductsBySubCategory(sub_category_id) {
    try {
        const response = await client.query(`SELECT * FROM products WHERE sub_category_id = $1`, [sub_category_id]);

        if (response.rows.length === 0) {
            return { status: 404, message: "No product found by sub-category id" };
        }

        return { status: 200, message: "Products found", data: response.rows };
    } catch (error) {
        console.error("Error at getting the products by sub category id in controller:", error);
        return { status: 500, message: "Internal server error" };
    }
}

async function getAttributesByProductId(product_id) {
    try {
        if(product_id >=1 &&  product_id <= 10) product_id == 1;
        const response = await client.query(`SELECT * FROM product_attributes WHERE product_id = $1`, [product_id]);

        if (response.rows.length === 0) {
            return { status: 404, message: "No product found by sub-category id" };
        }

        return { status: 200, message: "Products found", data: response.rows };
    } catch (error) {
        console.error("Error at getting the products by sub category id in controller:", error);
        return { status: 500, message: "Internal server error" };
    }
}

module.exports = {
    getAllCategories, 
    getCategoryById, 
    getAllSubCategories,
    getSubCategoriById,
    getProductsBySubCategory,
};