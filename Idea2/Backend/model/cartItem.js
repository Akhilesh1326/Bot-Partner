const mongoose = require("mongoose");

const cartitem = new mongoose.Schema({
    cart_id :{type: mongoose.Schema.Types.objectId , require : true , ref : 'Cart'} ,
    product_id :{type : Number , require : true},
    quantity :{type:Number , require : true},
    create_at:{type:Date , default : Date.now},
    updated_at: {type : Date , default : Date.now},
});
module.exports = mongoose.model('cartItem' , cartitem);
