const cart = require("../model/cart");
const Cart = require("../model/cart")
const CartItem = require("../model/cartItem")


const addItemInCart = async(userId, total) =>{
    try {
        const newCart = new Cart({
            user_id : userId,
            total : total,
        });

        const saveCart = await newCart.save();
        
    } catch (error) {
        
    }
}

