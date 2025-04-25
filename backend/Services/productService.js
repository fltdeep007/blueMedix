const Product = require('../Models/Products/Product');
// const Seller = require('../Models/User/Roles/Seller');
const Category = require('../Models/Products/Category');

const getAllProducts = async () => {
  try {
    const products = await Product.find().populate('category', 'name');

    const formattedProducts = products.map(product => {
      const prod = product.toObject(); // convert Mongoose doc to plain object
      prod.category = prod.category?.name || null; // replace category object with name
      return prod;
    });

    return { success: true, products: formattedProducts };
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

      const category = await Category.findById(categoryId).select('name');
  
      // Check if the category was found
      if (!category) {
        return { success: false, message: 'Category not found' };
      }
  
      
      const products = await Product.find({ category: categoryId }).populate('category', 'name');

      const formattedProducts = products.map(product => {
        const prod = product.toObject(); // convert Mongoose doc to plain object
        prod.category = prod.category?.name || null; // replace category object with name
        return prod;
      });
  
      return { success: true, products: formattedProducts };
  
   
  
     
    } catch (error) {
      console.error("Error in getProductByCategory:", error);
      
      return { success: false, message: 'An error occurred while fetching products by category.', error: error.message };
    }
  };

  const getAllCategory = async() =>{
    try{
        const categories = await Category.find();
        return{success:true , Categories: categories};
    }catch(error){
        console.log("Error in fetching categories");
        return { success: false, message: 'An error occurred while fetching  categories.', error: error.message };
        
    }
  }
  


module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    deleteProduct,
    updateProduct,
    getProductByCategory,
    getAllCategory
};


