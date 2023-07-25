// controllers/productController.js
const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;
        const newProduct = new Product({ name, description, price, imageUrl });
        await newProduct.save();
        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Failed to create product' });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
};
