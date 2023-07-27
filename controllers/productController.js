// controllers/productController.js
const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const { searchQuery } = req.query;

        // If searchQuery is provided, perform a search
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            const products = await Product.find({ name: regex });
            res.status(200).json(products);
        } else {
            // Otherwise, fetch all products
            const products = await Product.find({});
            res.status(200).json(products);
        }
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    try {
        const { name, description, price, imageUrl, quantity } = req.body;
        const newProduct = new Product({ name, description, price, imageUrl, quantity });
        await newProduct.save();
        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Failed to create product' });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, imageUrl, quantity } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { name, description, price, imageUrl, quantity },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Failed to update product' });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("updatedProduct -- id", id)
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Failed to delete product' });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
