// controllers/cartController.js
const CartItem = require('../models/Cart');


//Replace `CartItem` with your actual cart item model and schema
const getAllCartItems = async (req, res) => {
    try {
        const cartItems = await CartItem.find();
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cart items' });
    }
};


// Get cart items for a specific user
const getCartItems = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const cartItems = await CartItem.find({ userId }).populate('productId');
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cart items' });
    }
};

// Add a product to the cart
const addToCart = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        // Check if the cart item already exists for the user and product
        let cartItem = await CartItem.findOne({ userId, productId });

        if (cartItem) {
            // If the cart item exists, update the quantity
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // If the cart item does not exist, create a new one
            cartItem = new CartItem({ userId, productId, quantity });
            await cartItem.save();
        }

        res.status(201).json({ message: 'Product added to cart successfully!', cartItem });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add product to cart.' });
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
    getAllCartItems,
};
