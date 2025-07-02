
const { Client } = require("pg");
const mongoose = require('mongoose');

let client;

const connectToPostgresSQL = () => {
    if (!client) {
        client = new Client({
            user: 'postgres',
            host: 'localhost',
            database: process.env.PG_DB_NAME,
            password: process.env.PG_PASSWORD,
            port: process.env.PG_PORT,
        });

        client.connect()
            .then(() => {
                console.log("Connected to PostgreSQL");
            })
            .catch((err) => {
                console.error("PostgreSQL connection error", err);
            });
    }

    return client;
};

// MongoDb connection

const connectToMongo = () =>{
    mongoose.connect("mongodb://localhost:27017/bot-partner" , {
        useNewUrlParser : true ,
        useUnifiedTopology : true ,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection Error" , err) );
}


module.exports = { connectToPostgresSQL, connectToMongo };
