const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk'); // Import the AWS SDK
const Utils = require('../models/utils');
const { default: axios } = require('axios');
const { sendOneSignalNotification } = require('../utils/pushNotification');

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

        const { name, email, gender, tenantType, image, firebaseId } = req.body;

        // Fetch maxCoinsToAssign from "utils" document
        const maxCoinsToAssign = await getMaxCoinsToAssign();

        const newUser = new User({
            firebaseId,
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

router.get('/getUserByFirebaseId/:firebaseId', async (req, res) => {
    const { firebaseId } = req.params;

    try {
        const user = await User.findOne({ firebaseId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user details as JSON response
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by firebase Id:', error);
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
        if (!appUpdateDocument) {
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

router.get('/getAllLocations', async (req, res) => {
    try {
        const locationsDocument = await Utils.findOne({ name: 'locations' });
        return res.status(200).json({ locations: locationsDocument._doc.locations });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ error: 'Error fetching locations' });
    }
});

router.post('/instamojoWebhook', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('Received webhook:', webhookData);
        //const privateSalt = "ef77b9c5c8a3a5d8a6bae8c2e46011f43fcb4b3f9f1b4db0057c687e6a8b35e4"; // Ideally should be from process.env.INSTAMOJO_PRIVATE_SALT;

        // const generatedMac = crypto.createHmac('sha1', privateSalt)
        //     .update(JSON.stringify(webhookData))
        //     .digest('hex');
        // console.log("generatedMac", generatedMac)
        // // Verify the MAC to confirm the webhook is from Instamojo
        // if (generatedMac !== webhookData.mac) {
        //     return res.status(403).json({ error: 'Invalid MAC, unauthorized.' });
        // }

        // Normalize buyer_phone by removing +91 if present
        let buyerPhone = webhookData.buyer.phone;
        if (buyerPhone.startsWith('+91')) {
            buyerPhone = buyerPhone.substring(3); // Remove the '+91' prefix
        }
        console.log('buyerPhone:', buyerPhone);
        console.log('webhookData.status:', webhookData.payment.status);
        // Check if payment status is 'Credit'
        if (webhookData.payment.status === 'SUCCESS' && buyerPhone) {
            const coinsToAdd = 10000;
            const subscriptionStartDate = (Date.now() / 1000).toString();
            console.log("subscriptionStartDate", subscriptionStartDate / 1000)
            // Update the user's coin balance and subscription start date
            await User.findOneAndUpdate(
                { phoneNumber: buyerPhone },
                {
                    $inc: { coins: coinsToAdd }, // Increment user's coins by 10000
                    subscriptionStartDate: subscriptionStartDate // Update subscription start date
                },
                { new: true } // Return the updated user object
            );

            res.status(200).send('Webhook processed successfully');
        } else {
            res.status(400).send('Payment failed or buyer phone not provided');
        }
    } catch (error) {
        console.error('Error handling Instamojo webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/sendotp', async (req, res) => {
    const { phoneNumber, assignedOtp } = req.body; // Assume this contains the necessary phone number or other data
    try {
        const apiResponse = await fetch('http://msg.mtalkz.com/V2/http-api-post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apikey: process.env.MTALKZ_API_KEY,  // Use environment variable for API key
                senderid: 'MTAMOI',
                number: phoneNumber,
                message: `Your OTP- One Time Password is ${assignedOtp} to authenticate your login with #4r3mk23 Powered By mTalkz`,
                format: 'json',
            }),
        });

        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        console.error('Error forwarding OTP request:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/fetchDukan', async (req, res) => {
    try {
        const response = await axios.get('https://mydukaan.io/rentodisha');
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error fetching content');
    }
});

router.put('/updateDeviceToken', async (req, res) => {
    const { phoneNumber, deviceToken } = req.body;

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.deviceToken = deviceToken; // Update the deviceToken

        const updatedUser = await user.save();

        res.status(200).json({ message: 'Device token updated successfully', updatedUser });
    } catch (error) {
        console.error('Error updating device token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/sendNotification', async (req, res) => {
    const { userIds, message, data } = req.body;
    try {
        const response = await sendOneSignalNotification(userIds, message, data);
        res.status(200).json({ message: 'Notification sent successfully', data: response });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
