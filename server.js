const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

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
// Start the server
const port = 3040;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
