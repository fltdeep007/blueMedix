const productService = require('../Services/productService');

const getAllProducts = async (req, res) => {
    const result = await productService.getAllProducts();
    if (result.success) {
        res.status(200).json(result.products);
    } else {
        res.status(500).json({ message: result.message });
    }
};

const getProductById = async (req, res) => {
    const { productId } = req.params;

    const result = await productService.getProductById(productId);

    if (result.success) {
        res.status(200).json(result.product);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const addProduct = async (req, res) => {
    const productData = req.body;

    const result = await productService.addProduct(productData);

    if (result.success) {
        res.status(201).json(result.product);
    } else {
        res.status(500).json({ message: result.message });
    }
};

const deleteProduct = async (req, res) => {
    const { productId } = req.params;

    const result = await productService.deleteProduct(productId);

    if (result.success) {
        res.status(200).json({ message: result.message });
    } else {
        res.status(404).json({ message: result.message });
    }
};

const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const productData = req.body;

    const result = await productService.updateProduct(productId, productData);

    if (result.success) {
        res.status(200).json(result.product);
    } else {
        res.status(404).json({ message: result.message });
    }
};

const getProductByCategory = async (req, res) => {
    const { categoryId } = req.params;

    const result = await productService.getProductByCategory(categoryId);

    if (result.success) {
        res.status(200).json(result.products);
    } else {
        res.status(404).json({ message: result.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    deleteProduct,
    updateProduct, 
    getProductByCategory
};

