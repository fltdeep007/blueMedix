const {getSellers, addSeller, getSellerById} = require("../Services/sellerServices");

const getAllSellers = async (req, res) => {
    try {
        const sellers = await getSellers();
        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addNewSeller = async (req, res) => {
    const sellerData = req.body;
    try {
        const newSeller = await addSeller(sellerData);
        res.status(201).json(newSeller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSeller = async (req, res) => {
    const { sellerId } = req.params;
    try {
        const seller = await getSellerById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllSellers,
    addNewSeller,
    getSeller
};