const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk'); // Import the AWS SDK

// AWS S3 configuration
const s3 = new AWS.S3();

// Multer-S3 storage configuration
const storage = multerS3({
    s3,
    bucket: 'primecaves', // Your S3 bucket name
    acl: 'public-read', // Set ACL to public-read for public access
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
        console.log("file", file)
        const key = `user-images/${Date.now().toString()}-${file.originalname}`;
        cb(null, key);
    },
});

router.post('/register', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        console.log("req.body", req.body)
        const existingUser = await User.findOne({ phoneNumber });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const { name, email, gender, tenantType, image } = req.body;

        const newUser = new User({
            name,
            email,
            gender,
            image, // The image URL is provided by the client
            tenantType,
            phoneNumber,
        });

        const savedUser = await newUser.save();

        return res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});


router.delete('/delete/:id', async (req, res) => {
    const s3 = new AWS.S3();
    const { id } = req.params;
    try {
        // Retrieve the user data including the image URL
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Extract the key (filename) from the image URL, assuming the URL is in the format of an S3 URL
        const imageUrl = user.image;
        const imageUrlParts = imageUrl.split('/');
        const key = imageUrlParts[imageUrlParts.length - 1];

        // Delete the user document from MongoDB
        await User.findByIdAndDelete(id);

        // If the user had an image URL, delete the corresponding object (image) from AWS S3
        if (key) {
            await s3.deleteObject({
                Bucket: 'primecaves',
                Key: key,
            }).promise();
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user data' });
    }
});

router.get('/getAllUsers', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/check-phone/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;
    try {
        const user = await User.findOne({ phoneNumber });
        res.json({ exists: !!user }); // Return true if the user exists, false otherwise
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Replace 'your_secret_key' with your actual secret key for JWT
        const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

router.get('/getUserByPhoneNumber/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;

    try {
        // Find the user based on the provided phone number
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user details as JSON response
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by phone number:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
