const express = require("express")
const app = express()
const PORT = process.env.PORT || 8000;
const ConnectDB = require("./ConnectDB");



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
        const res = await createUser(username, email, password, firstName, lastname, phonenumber, dateofbirth);
        if(res.status == 201){
            res.status(200).json({message:"registration successful"});
        }
        else{
            res.status(500).json({message:"registration unsuccessful"});
        }
    } catch (error) {
        res.status(500);
    }
})
app.listen(PORT, ()=>console.log("Server started at ", PORT));
