const { Client } = require("pg");

const connectToPostgresSQL = () => {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'bot-partner',
        password: 'postgreSqlispassword@26',
        port: 5432,
    });

    client.connect()
        .then(() => {
            console.log("Connected to PostgreSQL");
        })
        .catch((err) => {
            console.error("PostgreSQL connection error", err);
        });

    return client;
};


module.exports = { connectToPostgresSQL };
