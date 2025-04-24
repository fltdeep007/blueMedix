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

  const updateCartItemQuantityController = async (req, res) => {
    const { userId, productId } = req.params;
    const { quantityChange } = req.body;

    // Validate quantityChange
    if (quantityChange === undefined || typeof quantityChange !== 'number' || !Number.isInteger(quantityChange) || quantityChange === 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantityChange provided. Must be a non-zero integer.' });
    }

    try {
        const result = await customerService.updateCartItemQuantity(userId, productId, quantityChange);

        if (result.success) {
            res.status(200).json(result);
        } else {
            // Handle specific service errors
            if (result.message === 'Customer not found' || result.message === 'Product not found in cart') {
                 res.status(404).json(result);
            } else if (result.message.startsWith('Cannot decrease quantity below 1')) {
                 res.status(400).json(result); // Bad request if trying to decrease below 1 explicitly
            }
            else {
                res.status(500).json(result); // Catch any other unexpected service errors
            }
        }
    } catch (error) {
        console.error('Server error in updateCartItemQuantityController:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while updating cart item quantity'
        });
    }
};

module.exports = {
    addItemToCart,
    deleteCartItem,
    getCart,
    updateCartItemQuantityController
};
