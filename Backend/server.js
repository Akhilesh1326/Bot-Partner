const express = require("express")
const app = express()
const PORT = process.env.PORT || 8000;
const ConnectDB = require("./ConnectDB");

// Connection of Databases as Postgre and MongoDB
ConnectDB.connectToPostgresSQL();

app.get('/', (req, res)=>{
    return res.json({message:"Hello it's bot server"});
})
app.listen(PORT, ()=>console.log("Server started at ", PORT));
