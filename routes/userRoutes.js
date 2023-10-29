const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk'); // Import the AWS SDK
const Utils = require('../models/utils');

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

const getMaxCoinsToAssign = async () => {
    try {
        // Assuming you have a model for "utils" (you may need to replace 'Utils' with your actual model name)
        const utilsDocument = await Utils.findOne({ name: 'coins' }); // Replace 'name' with the actual field name that matches 'coins'
        if (utilsDocument && utilsDocument.maxCoinsToAssign) {
            return utilsDocument.maxCoinsToAssign;
        }
        return 0; // Default value if not found
    } catch (error) {
        console.error('Error fetching maxCoinsToAssign:', error);
        return 2; // Default value if an error occurs
    }
};

const getSubscriptionMaxDays = async () => {
    try {
        // Assuming you have a model for "utils" (you may need to replace 'Utils' with your actual model name)
        const utilsDocument = await Utils.findOne({ name: 'subscription' }); // Replace 'name' with the actual field name that matches 'coins'
        if (utilsDocument && utilsDocument.maxSubscriptionDays) {
            return utilsDocument.maxSubscriptionDays;
        }
        return 0; // Default value if not found
    } catch (error) {
        console.error('Error fetching maxSubscriptionDays:', error);
        return 30; // Default value if an error occurs
    }
}

router.post('/register', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const existingUser = await User.findOne({ phoneNumber });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const { name, email, gender, tenantType, image } = req.body;

        // Fetch maxCoinsToAssign from "utils" document
        const maxCoinsToAssign = await getMaxCoinsToAssign();

        const newUser = new User({
            name,
            email,
            gender,
            image, // The image URL is provided by the client
            tenantType,
            phoneNumber,
            coins: maxCoinsToAssign, // Initialize coins field with maxCoinsToAssign value
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

// Define a route to update user coins and check subscription
router.put('/updateUserCoins/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;
    const { coins } = req.body; // New coins value

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscriptionStartDate = user.subscriptionStartDate;
        const currentTimestamp = Date.now();
        const maxSubscriptionDays = await getSubscriptionMaxDays(); // Implement this function to fetch maxSubscriptionDays from the utils model
        const subscriptionStartDateTimestamp = Number(subscriptionStartDate) * 1000;
        const subscriptionActive = subscriptionStartDateTimestamp !== NaN &&
            currentTimestamp - subscriptionStartDateTimestamp < maxSubscriptionDays * 24 * 60 * 60 * 1000;

        // Update the user's coins field
        user.coins = coins - 1;

        // Save the updated user document
        const updatedUser = await user.save();

        // Calculate and return coinsLeft and subscriptionActive
        const coinsLeft = coins - 1;

        res.status(200).json({ coinsLeft, subscriptionActive });
    } catch (error) {
        console.error('Error updating user coins:', error);
        res.status(500).json({ error: 'Error updating user coins' });
    }
});

router.get('/getAppUpdateStatus', async (req, res) => {
    try {
        const appUpdateDocument = await Utils.findOne({ name: 'appUpdate' });
        console.log("appUpdateDocument", appUpdateDocument)
        if (!appUpdateDocument) {
            console.log('No appUpdate document found or blockApp is not defined.');
            return res.status(200).json({ blockApp: false });
        }

        const blockAppStatus = appUpdateDocument._doc.blockApp;
        const action = appUpdateDocument._doc.action;
        console.log('Returning blockApp status:', blockAppStatus);
        return res.status(200).json({ blockApp: blockAppStatus, action });
    } catch (error) {
        console.error('Error fetching appUpdate status:', error);
        return res.status(500).json({ error: 'Error fetching appUpdate status' });
    }
});

module.exports = router;
