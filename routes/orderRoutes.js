// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });;
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});


// // Create a new order
// router.post('/', async (req, res) => {
//     try {
//         const { userId, cartItems, totalPrice } = req.body;
//         const newOrder = await Order.create({ userId, cartItems, totalPrice });
//         res.status(201).json(newOrder);
//     } catch (error) {
//         console.error('Error creating order:', error);
//         res.status(500).json({ error: 'Failed to create order.' });
//     }
// });

// Update order status
router.put('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
});


// Delete an order by ID
router.delete('/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const deletedOrder = await Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully', order: deletedOrder });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Failed to delete order' });
    }
});

module.exports = router;
