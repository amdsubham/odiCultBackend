const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');
const checkoutController = require('./controllers/checkoutController');
const adminAuthController = require('./controllers/adminAuthController');
const orderRoutes = require('./routes/orderRoutes');
require('dotenv').config();
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// MongoDB Configuration
const dbURI = process.env.DB_URI; // Change this to your MongoDB URI
mongoose
    .connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

// Import and use routes
const userRoutes = require('./routes/userRoutes');
const rentPostRoutes = require('./routes/rentPostRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/user', userRoutes);
app.use('/api/rentpost', rentPostRoutes);
app.use('/api/messages', messageRoutes);


// Product routes
app.get('/api/products', productController.getAllProducts);
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);

// Cart routes
app.get('/api/cart', cartController.getCartItems);
app.post('/api/cart/add', cartController.addToCart);
app.delete('/api/cart/remove/:itemId', cartController.removeFromCart);
app.get('/api/cart/all', cartController.getAllCartItems);

// Order routes
app.use('/api/orders', orderRoutes);

// Checkout routes
app.post('/api/checkout/order', checkoutController.createOrder);

// Register a new admin user
app.post('/api/admin/register', adminAuthController.register);

// Login for admin users
app.post('/api/admin/login', adminAuthController.login);
// Start the server
const port = 3040;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
