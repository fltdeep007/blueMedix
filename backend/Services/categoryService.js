const { ObjectId } = require('mongodb');
const Category = require("../Models/Products/Category");

const updateCategory = async (categoryId, updateData) => {
  try {
    console.log(categoryId)
    
    const updatedCategory = await Category.findOneAndUpdate(
      { _id: categoryId },
      updateData,
      { new: true, runValidators: true }
    );

    return updatedCategory; // Return the updated category or null if not found

  } catch (error) {
    throw error; // Re-throw the error for the controller to handle
  }
};

module.exports = {
  updateCategory
};