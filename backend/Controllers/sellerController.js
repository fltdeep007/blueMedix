const { getSellers, getSellerById } = require("../Services/sellerServices");

/**
 * Controller to get all sellers
 */
const getAllSellers = async (req, res) => {
  try {
    const sellers = await getSellers();
    res.status(200).json(sellers);
  } catch (error) {
    console.error("Error in getAllSellers controller:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller to get a seller by ID
 */
const getSeller = async (req, res) => {
  const { sellerId } = req.params;
  
  try {
    const seller = await getSellerById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    res.status(200).json(seller);
  } catch (error) {
    console.error("Error in getSeller controller:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSellers,
  getSeller
};