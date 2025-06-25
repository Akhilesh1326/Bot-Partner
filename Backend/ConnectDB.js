
const { Client } = require("pg");

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

module.exports = { connectToPostgresSQL };
