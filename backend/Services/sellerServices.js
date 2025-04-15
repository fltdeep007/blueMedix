const getAllSellers = async (req, res) => {
    try {
        const sellers = await Seller.find();
        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSellerById = async (req, res) => {
    const { sellerId } = req.params;

    try {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        res.status(200).json(seller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addSeller = async (req, res) => {
    const sellerData = req.body;

    try {
        const seller = new Seller(sellerData);
        await seller.save();
        res.status(201).json(seller);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllSellers,
    getSellerById,
    addSeller
};