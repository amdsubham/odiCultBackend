// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        cartItems: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        paymentMode: {
            type: String,
            enum: ['Cash on Delivery'], // Add more payment modes here if needed
            required: true,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
