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
const createUser = require("./controller/userController");


// Connection of Databases as Postgre and MongoDB
ConnectDB.connectToPostgresSQL();

app.get('/', (req, res)=>{
    return res.json({message:"Hello it's bot server"});
})

app.post('/register', async(req, res)=>{
    const {username, email, password, firstName, lastname, phonenumber, dateofbirth} = req.body;
    if(!username) res.status(422).json({message:"Username is missing"});
    if(!email) res.status(422).json({message:"email is missing"});
    if(!password) res.status(422).json({message:"password is missing"});
    if(!firstName) res.status(422).json({message:"firstname is missing"});
    if(!lastname) res.status(422).json({message:"lastname is missing"});
    if(!phonenumber) res.status(422).json({message:"phonenumber is missing"});
    if(!dateofbirth) res.status(422).json({message:"dateofbirht is missing"});
    try {
        const DB_res = await createUser(username, email, password, firstName, lastname, phonenumber, dateofbirth);

        if(DB_res.status == 201){
            const token = jwt.sign({
                userId: DB_res.data.userid,
                username: DB_res.data.username
            }, process.env.JWT_SECRET);
            res.cookie('userCookie', token);
            res.status(200).json({message:"registration successful"});
        }
        else{
            res.status(500).json({message:"registration unsuccessful"});
        }
    } catch (error) {
        console.log("Error while registering user", error.message);
        res.status(500);
    }
})


app.listen(PORT, ()=>console.log("Server started at ", PORT));
