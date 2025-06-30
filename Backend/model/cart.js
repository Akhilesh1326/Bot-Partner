const mongoose = require("mongoose");

const cartschema = new mongoose.Schema({
    user_id :{type :Number , required : true } , 
    total :{type : Number , require : true} ,
    created_at :{ type : Date , default : Date.now} ,
    Updated_at : { type : Date , default : Date.now} ,
});
module.exports = mongoose.model('Cart' , cartschema)
