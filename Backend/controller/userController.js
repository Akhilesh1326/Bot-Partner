const connectDB = require('../ConnectDB');

const client = connectDB.connectToPostgresSQL();

async function createUser(username, email, password, firstname, lastname, phonenumber, dateofbirth) {
    try {
        const response = await client.query(`INSERT INTO users(username, email, password, firstname, lastname, phonenumber, dateofbirth) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[username, email, password, firstname, lastname, phonenumber, dateofbirth]);
        return {status : 201, message: "user registered", data: response.rows[0]};
    } catch (error) {
        if(error.code == 23505) return{status: 409, message: "username or email is already present"};
        return {status: 400, message : "User register error occured"};
    }
};



module.exports = {createUser};