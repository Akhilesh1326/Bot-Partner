const connectDB = require('../ConnectDB');

const client = connectDB.connectToPostgresSQL();

async function createUser(username, email, password, firstname, lastname, phonenumber, dateofbirth) {
    try {
        const response = await client.query(`INSERT INTO users(username, email, password, firstname, lastname, phonenumber, dateofbirth) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[username, email, password, firstname, lastname, phonenumber, dateofbirth]);
        return {status : 201, message: "user registered", data: response.rows[0]};
    } catch (error) {
        if(error.code == 23505){
            console.log("Error occured because of username repeation");
            return{status: 409, message: "username or email is already present"};
        }
        console.log("Error occured in create new user in controller");
        return {status: 400, message : "User register error occured"};
    }
};

async function addUserAddress(userid, addresstype, addressline1, addressline2, country,state, city, phonenumber){
    try {
        const responce = await client.query(`INSERT INTO addresses(userid, addresstype, addressline1, addressline2, country, state, city, phonenumber) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [userid, addresstype, addressline1, addressline2, country, state, city, phonenumber]);
        return {status : 201, message: "address added", data : responce.rows[0]};
    } catch (error) {
        console.log("Address inserting error occured in controller");
        return {status: 400, message: "error occured in address inserting"}
    }
}

module.exports = {createUser, addUserAddress};