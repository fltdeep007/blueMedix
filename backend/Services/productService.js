const Product = require('../Models/Products/Product');
const Seller = require('../Models/User/Roles/Seller');

const getAllProducts = async () => {
  try {
    const products = await Product.find();
    return { success: true, products };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getProductById = async (productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        } 
        else {
            return { success: true, product };
        }
    }
    catch (error) {
        return { success: false, message: error.message };
    }
};

const addProduct = async (productData) => {
    try {
        const product = new Product(productData);
        await product.save();
        return { success: true, message: 'Product added successfully', product };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const deleteProduct = async (productId) => {
    try {
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }
        return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

const updateProduct = async (productId, productData) => {
    try {
        const product = await Product.findByIdAndUpdate(productId, productData, { new: true });
        if (!product) {
            return { success: false, message: 'Product not found' };
        }
        return { success: true, message: 'Product updated successfully', product };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const getProductByCategory = async (categoryId) => { 
    try {
      const products = await Product.find({ category: categoryId });
  
      if (!products || products.length === 0) {
        return { success: false, message: 'No products found for this category' };
      }
  
      return { success: true, products };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
  


module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductByCategory,
};


