const User = require("../Models/User/User");

/**
 * Get all sellers from the database
 * @returns {Promise<Array>} Array of seller documents
 */
const getSellers = async () => {
  try {
    // Find all users with the role of 'Seller'
    const sellers = await User.find({ role: 'Seller' });
    return sellers;
  } catch (error) {
    throw new Error(`Error fetching sellers: ${error.message}`);
  }
};

/**
 * Get a seller by ID
 * @param {string} sellerId - The ID of the seller to find
 * @returns {Promise<Object>} The seller document
 */
const getSellerById = async (sellerId) => {
  try {
    // Validate MongoDB ObjectId format
    if (!sellerId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid seller ID format');
    }
    
    // Find a user with both the role of 'Seller' and the matching ID
    const seller = await User.findOne({ _id: sellerId, role: 'Seller' });
    return seller;
  } catch (error) {
    throw new Error(`Error fetching seller: ${error.message}`);
  }
};

module.exports = {
  getSellers,
  getSellerById
};