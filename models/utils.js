const mongoose = require('mongoose');

const utilsSchema = new mongoose.Schema({
    maxCoinsToAssign: Number,
    name: String,
    maxSubscriptionDays: String,
});

module.exports = mongoose.model('Utils', utilsSchema);
