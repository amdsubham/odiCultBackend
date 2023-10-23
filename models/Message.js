// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: String,
    receiverId: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    image: String, // Store the image URL or base64 data
});

module.exports = mongoose.model('Message', messageSchema);
