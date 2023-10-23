const express = require('express');
const RentPost = require('../models/rentPost');
const User = require('../models/user');

const router = express.Router();

// API Routes

// Create a new rental post
// Create a new rental post
router.post('/create', async (req, res) => {
    try {
        const newPostData = req.body;
        console.log("req.body", req.body)
        // Include the user's ID in the rental post data
        newPostData.userId = req.body.userId; // Assuming you have user information in req.user

        // Create a new RentPost document
        const newPost = new RentPost(newPostData);
        const savedPost = await newPost.save();

        // Obtain the _id of the saved RentPost
        const postId = savedPost._id;

        // Update the user's User document to include the rental post's ID
        await User.findByIdAndUpdate(req.body.userId, { $push: { rentPosts: postId } });

        return res.status(201).json(savedPost);
    } catch (error) {
        console.error('Error creating rental post:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update a rental post by ID
// Update a rental post by ID
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const updatedPostData = req.body;
    console.log("updatedPostData", updatedPostData)

    try {
        // Find the rental post by ID
        const rentalPost = await RentPost.findById(id);

        if (!rentalPost) {
            return res.status(404).json({ error: 'Rental post not found' });
        }

        // Check if the user is the owner of the rental post
        if (rentalPost.userId.toString() !== req.body.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Update the rental post details
        rentalPost.images = updatedPostData.images;
        rentalPost.location = updatedPostData.location;
        rentalPost.adTitle = updatedPostData.adTitle;
        // Update other fields as needed

        // Save the updated rental post
        const updatedPost = await rentalPost.save();

        return res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating rental post:', error);
        res.status(500).json({ error: 'Error updating rental post' });
    }
});


// Delete a rental post by ID
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPost = await RentPost.findByIdAndDelete(id);
        if (!deletedPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Remove the deleted post ID from the user's rentPosts array
        await User.findByIdAndUpdate(deletedPost.userId, { $pull: { rentPosts: id } });

        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting rental post:', error);
        res.status(500).json({ error: 'Error deleting post' });
    }
});


// Get all rental posts by a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userPosts = await RentPost.find({ userId });
        console.log("userPosts", userPosts)
        return res.status(200).json(userPosts);
    } catch (error) {
        console.error('Error fetching user rental posts:', error);
        res.status(500).json({ error: 'Error fetching user posts' });
    }
});

// Get all rental posts
router.get('/getAllPosts', async (req, res) => {
    try {
        const allPosts = await RentPost.find();
        return res.status(200).json(allPosts);
    } catch (error) {
        console.error('Error fetching all rental posts:', error);
        res.status(500).json({ error: 'Error fetching all posts' });
    }
});


module.exports = router;
