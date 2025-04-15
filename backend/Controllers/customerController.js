const customerService = require('../Services/customerService');

const addItemToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  const result = await customerService.addToCart(userId, productId, quantity);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
};

const deleteCartItem = async (req, res) => {
    const { userId, productId } = req.params;
  
    const result = await customerService.removeFromCart(userId, productId);
  
    if (result.success) {
      res.json({ message: result.message, cart: result.cart });
    } else {
      res.status(404).json({ message: result.message });
    }
};

const getCart = async (req, res) => {
    const { userId } = req.params;
  
    const result = await customerService.getCart(userId);
  
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: result.message });
    }
  };

module.exports = {
    addItemToCart,
    deleteCartItem,
    getCart
};
