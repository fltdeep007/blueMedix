const { updateCategory } = require("../Services/categoryService");

const updCat = async (req, res) => {
  try {
    // Change req.params.id to req.params.categoryId to match the route parameter
    console.log("Category ID from params:", req.params.categoryId);
    const updatedCategory = await updateCategory(req.params.categoryId, req.body);
    
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    res.status(200).json({ success: true, updatedCategory });
  } catch (error) {
    // Handle different types of errors more specifically if needed
    if (error.message.includes('Cast to ObjectId failed') || 
        error.message.includes('Invalid category ID format')) {
      return res.status(400).json({ success: false, message: 'Invalid category ID format' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updCat
};