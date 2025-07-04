const express = require("express")
const PORT = process.env.PORT || 8000;
const ConnectDB = require("./ConnectDB");
const cors = require('cors');
const bodyParser = require('body-parser')
require('dotenv').config();

// JWT related imports
const cookieParser = require('cookie-parser');
const http = require('http');
const jwt = require('jsonwebtoken');

// Server by express
const app = express()

// cors policy
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE'],
    credentials: true
}));

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());


// Imports for controllers 
const {createUser, 
    addUserAddress} = require("./controller/userController");

const {
    getAllCategories, 
    getCategoryById, 
    getAllSubCategories,
    getSubCategoriById,
    getProductsBySubCategory,} = require("./controller/productController");


const {fetchProducts} = require('./controller/LLMController');
const { connect } = require("http2");


// Connection of Databases as Postgre and MongoDB
ConnectDB.connectToPostgresSQL();
ConnectDB.connectToMongo();


app.get('/', (req, res)=>{
    return res.json({message:"Hello it's bot server"});
})

// API call for user login

// API call for registering new user
app.post('/api/register', async(req, res)=>{
    const {username, email, password, firstname, lastname, phonenumber, dateofbirth} = req.body;
    console.log(username, email, password, firstname, lastname, phonenumber, dateofbirth)
    if(!username) res.status(422).json({message:"Username is missing"});
    if(!email) res.status(422).json({message:"email is missing"});
    if(!password) res.status(422).json({message:"password is missing"});
    if(!firstname) res.status(422).json({message:"firstname is missing"});
    if(!lastname) res.status(422).json({message:"lastname is missing"});
    if(!phonenumber) res.status(422).json({message:"phonenumber is missing"});
    if(!dateofbirth) res.status(422).json({message:"dateofbirht is missing"});
    try {
        const DB_res = await createUser(username, email, password, firstname, lastname, phonenumber, dateofbirth);

        if(DB_res.status == 201){
            const token = jwt.sign({
                userId: DB_res.data.userid,
                username: DB_res.data.username
            }, process.env.JWT_SECRET);
            res.cookie('userCookie', token);
            res.status(200).json({message:"registration successful"});
        }
        else{
            res.status(DB_res.status).json({message:DB_res.message});
        }
    } catch (error) {
        console.log("Error while registering user", error.message);
        res.status(500);
    }
});

// API call for add new address
app.post('/api/add-address', async(req, res)=>{
    const {addresstype, addressline1, addressline2, country, state, city, phonenumber} = req.body;
    if(!addresstype) res.status(422).json({message: "address type is missing"})
    if(!addressline1) res.status(422).json({message: "adress line 1 is missing"})
    if(!country) res.status(422).json({message: "country is missing"})
    if(!city) res.status(422).json({message: "city is missing"})
    if(!phonenumber) res.status(422).json({message: "phone number is missing"})

    const token = req.cookies.userCookie;
    let varifyToken = jwt.verify(token, process.env.JWT_SECRET);
    const userid = varifyToken.userId;
    try {
        const DB_res = await addUserAddress(userid, addresstype, addressline1, addressline2, country, state, city, phonenumber);
        if(DB_res.status == 201){
            res.status(200).json({message:"address added successful"});
        }
        else{
            res.status(DB_res.status).json({message:DB_res.message});
        }
    } catch (error) {
        console.log("Error while registering user", error.message);
        res.status(500);
    }    
})


// Products related API calls

app.get("/api/categories", async(req, res)=>{
    try {
        const db_resp = await getAllCategories();
        if(db_resp.status == 200) return res.status(db_resp.status).json({message: db_resp.message, data: db_resp.data});
        
        res.status(db_resp.status).json({message: db_resp.message});
    } catch (error) {
        console.log("error in server for getting all categories ", error);
        res.status(500).json({message:"Internal Server Error"});
    }
});

app.get("/api/category/:id", async(req,res)=>{
    try {
        const id = parseInt(req.params.id);

        if(isNaN(id)){
            res.status(400).json({message:"Invalid category Id"});
        }

        const DB_res = await getCategoryById(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting category by id");
        res.status(500).json({message:"Internal server error"});
    }
})

app.get("/api/all-subcategory/:id", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getAllSubCategories(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting all sub category by category id");
        res.status(500).json({message:"Internal server error"});
    }
});


app.get("/api/subcategory/:id", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getSubCategoriById(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});
        
    } catch (error) {
        console.log("Error in server for getting all sub category by category id");
        res.status(500).json({message:"Internal server error"});
    }
});


app.get("/api/sub-category/:id/products", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getProductsBySubCategory(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting all sub category by category id");
        res.status(500).json({message:"Internal server error"});
    }
});



// LLM related API calls

app.get("/api/get-recomendations", async(req, res)=>{
    try {
        const {productName, price} = req.query;
        console.log(productName, price)
        // console.log('hello');

        const result = await fetchProducts(productName, price);
        result.forEach(element => {
            console.log(element)
        });
        console.log("hellllooo")
        // res.status(200);
        res.status(200).json({recomendations: result});

    } catch (error) {
        console.log("Error while getting recomendations at server ", error);
        res.status(500).json({message:"Internal server error"})
    }
})

app.listen(PORT, ()=>console.log("Server started at ", PORT));
