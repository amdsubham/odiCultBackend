// controllers/cartController.js
const CartItem = require('../models/CartItem');

// Get cart items for a specific user
const getCartItems = async (req, res) => {
    try {
        const { userId } = req.query;
        const cartItems = await CartItem.find({ user: userId }).populate('product');
        res.status(200).json(cartItems);
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Failed to fetch cart items' });
    }
};

// Add a product to the cart
const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        const cartItem = await CartItem.findOne({ user: userId, product: productId });

        if (cartItem) {
            // If the item already exists in the cart, update the quantity
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // If the item is not in the cart, create a new cart item
            const newCartItem = new CartItem({ user: userId, product: productId, quantity });
            await newCartItem.save();
        }

        res.status(201).json({ message: 'Product added to cart successfully' });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ message: 'Failed to add product to cart' });
    }
};

// Remove a product from the cart
const removeFromCart = async (req, res) => {
    try {
        const { userId } = req.query;
        const itemId = req.params.itemId;
        await CartItem.findOneAndRemove({ _id: itemId, user: userId });
        res.status(200).json({ message: 'Product removed from cart successfully' });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ message: 'Failed to remove product from cart' });
    }
};

module.exports = {
    getCartItems,
    addToCart,
    removeFromCart,
};
