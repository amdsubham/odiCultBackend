// Backend: controllers/adminAuthController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser');

// Register a new admin user
exports.register = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the admin user already exists
        let adminUser = await AdminUser.findOne({ email });
        if (adminUser) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        // If the admin user does not exist, create a new admin user
        adminUser = new AdminUser({
            email,
            password,
        });

        // Hash the password before saving the admin user
        const salt = await bcrypt.genSalt(10);
        adminUser.password = await bcrypt.hash(password, salt);

        await adminUser.save();

        // Generate a JWT token and send it in the response
        const payload = {
            adminUser: {
                id: adminUser.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET_ADMIN, // Use a different secret for admin JWT tokens
            {
                expiresIn: 3600, // Token will expire in 1 hour
            },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error('Error registering admin user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login for admin users
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the admin user exists
        let adminUser = await AdminUser.findOne({ email });
        if (!adminUser) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate a JWT token and send it in the response
        const payload = {
            adminUser: {
                id: adminUser.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET_ADMIN, // Use a different secret for admin JWT tokens
            {
                expiresIn: 3600, // Token will expire in 1 hour
            },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error('Error logging in admin user:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
