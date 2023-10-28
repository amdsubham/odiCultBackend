const mongoose = require('mongoose');

const rentPostSchema = new mongoose.Schema({
    images: Array, // Array of image URLs
    location: String,
    adTitle: String,
    adDescription: String,
    userId: String,
    phone: String,
    email: String,
    maxResidents: Number,
    preference: String,
    isMaleOnly: Boolean,
    isFurnished: Boolean,
    hasAttachedBathroom: Boolean,
    isBachelorsAllowed: Boolean,
    user: Object,
    price: Number,
});

module.exports = mongoose.model('RentPost', rentPostSchema);
