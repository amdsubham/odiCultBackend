
// Define a storage for messages
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

const messages = [];

router.post('/send', async (req, res) => {
    const { senderId, receiverId, message, image } = req.body;

    // Check if sender and receiver are different users
    if (senderId === receiverId) {
        return res.status(400).json({ error: 'Sender and receiver cannot be the same.' });
    }

    // Create and store the message in MongoDB
    try {
        const newMessage = new Message({ senderId, receiverId, message, image });
        await newMessage.save();
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// API endpoint to fetch messages between two users
router.get('/fetch', async (req, res) => {
    const { senderId, receiverId } = req.query;

    try {
        // Fetch messages between sender and receiver from MongoDB
        const userMessages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        }).sort({ timestamp: 1 });

        res.status(200).json(userMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
