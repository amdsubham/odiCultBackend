const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    name: String,
    email: String,
    gender: String,
    image: String,
    tenantType: String,
    rentPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RentPost' }],
    firebaseId: String,
    coins: { type: Number, default: 0 },
    subscriptionStartDate: { type: String, default: 'NA' },
    location: Object,
    firebaseId: String,
    deviceToken: String,
});

module.exports = mongoose.model('User', userSchema);
