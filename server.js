// server.js
const express = require('express');
const mongoose = require('mongoose');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');
const userController = require('./controllers/userController');
const checkoutController = require('./controllers/checkoutController');
const orderRoutes = require('./routes/orderRoutes');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// User routes
app.post('/api/register', userController.registerUser);
app.post('/api/login', userController.loginUser);
app.get('/api/allUsers', userController.getAllUsers);

// Product routes
app.get('/api/products', productController.getAllProducts);
app.post('/api/products', productController.createProduct);

// Cart routes
app.get('/api/cart', cartController.getCartItems);
app.post('/api/cart/add', cartController.addToCart);
app.delete('/api/cart/remove/:itemId', cartController.removeFromCart);
app.get('/api/cart/all', cartController.getAllCartItems);

// Order routes
app.use('/api/orders', orderRoutes);

// Checkout routes
app.post('/api/checkout/order', checkoutController.createOrder);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
