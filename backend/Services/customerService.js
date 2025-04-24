const Product = require('../Models/Products/Product'); 
const Customer = require('../Models/User/Roles/Customer');

const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const customer = await Customer.findById(userId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const itemIndex = customer.cart.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      customer.cart[itemIndex].quantity += quantity;
    } else {
      customer.cart.push({ product: productId, quantity });
    }

    await customer.save();
    return { success: true, message: 'Item added to cart', cart: customer.cart };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const removeFromCart = async (userId, productId) => {
  try {
    const customer = await Customer.findById(userId);
    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    const initialLength = customer.cart.length;

    customer.cart = customer.cart.filter(
      item => item.product.toString() !== productId
    );

    if (customer.cart.length === initialLength) {
      return { success: false, message: 'Item not found in cart' };
    }

    await customer.save();

    return { success: true, message: 'Item removed from cart', cart: customer.cart };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const getCart = async (userId) => {
  try {
    const customer = await Customer.findById(userId).populate('cart.product');

    if (!customer) {
      return { success: false, message: 'Customer not found' };
    }

    const cartItems = customer.cart.map(item => ({
      product: {
        id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        description: item.product.description,
        image: item.product.image_link,
        discount: item.product.discount,
      },
      quantity: item.quantity
    }));

    return {
      success: true,
      cart: cartItems
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const updateCartItemQuantity = async (userId, productId, quantityChange) => {
  try {
      const customer = await Customer.findById(userId);
      if (!customer) {
          return { success: false, message: 'Customer not found' };
      }

      const itemIndex = customer.cart.findIndex(item => item.product.toString() === productId);

      if (itemIndex === -1) {
          return { success: false, message: 'Product not found in cart' };
      }

      const currentQuantity = customer.cart[itemIndex].quantity;
      const newQuantity = currentQuantity + quantityChange;

      if (newQuantity > 0) {
          customer.cart[itemIndex].quantity = newQuantity;
          await customer.save();
          // Optionally populate the updated cart item or the whole cart
          await customer.populate('cart.product');
          const updatedCartItem = customer.cart[itemIndex];

           // Format the updated item similarly to the getCart response
          const formattedUpdatedItem = {
               product: {
                  id: updatedCartItem.product._id,
                  name: updatedCartItem.product.name,
                  price: updatedCartItem.product.price,
                  description: updatedCartItem.product.description,
                  image: updatedCartItem.product.image_link,
                  discount: updatedCartItem.product.discount,
               },
               quantity: updatedCartItem.quantity
          };


          return {
              success: true,
              message: 'Cart item quantity updated',
              item: formattedUpdatedItem,
              cart: customer.cart.map(item => ({ // Return the whole updated cart as well for convenience
                   product: {
                      id: item.product._id,
                      name: item.product.name,
                      price: item.product.price,
                      description: item.product.description,
                      image: item.product.image_link,
                      discount: item.product.discount,
                   },
                   quantity: item.quantity
              }))
          };
      } else {
          // New quantity is 0 or less, remove the item
          const [removedItem] = customer.cart.splice(itemIndex, 1); // Remove the item and get the removed item
          await customer.save();

           // Populate the removed item's product details if available
           if (removedItem && removedItem.product) {
               await Product.populate(removedItem, { path: 'product' });
           }


          return {
              success: true,
              message: 'Cart item removed as quantity reached 0',
              removedItem: removedItem ? { // Return details of the removed item
                   product: {
                      id: removedItem.product?._id,
                      name: removedItem.product?.name,
                      price: removedItem.product?.price,
                      description: removedItem.product?.description,
                      image: removedItem.product?.image_link,
                      discount: removedItem.product?.discount,
                   },
                   quantity: removedItem.quantity // This will be the quantity before removal
              } : null,
               cart: customer.cart.map(item => ({ // Return the whole updated cart as well
                   product: {
                      id: item.product._id,
                      name: item.product.name,
                      price: item.product.price,
                      description: item.product.description,
                      image: item.product.image_link,
                      discount: item.product.discount,
                   },
                   quantity: item.quantity
               }))
          };
      }

  } catch (error) {
      console.error('Error in updateCartItemQuantityService:', error);
      return { success: false, message: error.message };
  }
};



module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  updateCartItemQuantity
};