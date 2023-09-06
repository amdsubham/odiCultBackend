// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    imageUrl: String,
    quantity: {
        type: Number,
        default: 1,
        required: true,
    },
    rating: {
        type: String,
        required: true,
    },
    map_location: {
        type: String,
    },
    contact: {
        type: String,
    },
});

module.exports = mongoose.model('Product', productSchema);
