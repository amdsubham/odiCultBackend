// controllers/checkoutController.js
const Order = require('../models/Order');

// Create a new order during checkout
const createOrder = async (req, res) => {
    try {
        const { userId, cartItems, totalPrice, name, email, address, pincode, phone } = req.body;

        // Create the order document in the database
        const order = new Order({
            userId,
            cartItems,
            totalPrice,
            name,
            email,
            address,
            pincode,
            phone,
            paymentMode: 'Cash on Delivery', // Assuming Cash on Delivery is the only payment mode for now
            status: 'Processing',
        });

        // Save the order to the database
        await order.save();

        // Respond with success message
        res.status(201).json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Failed to place the order.' });
    }
};

module.exports = { createOrder };
