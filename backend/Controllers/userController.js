const {createUser, getAllUsers, updateUser, deleteUser} = require('../Services/userService');
const User = require('../Models/User/User');
const mongoose = require('mongoose');

// const createUser = async (req, res) => {
//     try {
//         const user = await createUser(req.body);
//         res.status(201).json(user);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// const updateUser = async (req, res) => {
//     try {
//         const user = await updateUser(req.params.id, req.body);
//         res.status(200).json(user);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// const deleteUser = async (req, res) => {
//     try {
//         await deleteUser(req.params.id);
//         res.status(200).json({ message: 'User deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

const getUserById = async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCustomersInSellerPincode =  async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Validate sellerId format
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format'
      });
    }

    // Find the seller to get their pincode
    const seller = await User.findOne({
      _id: sellerId,
      role: 'Seller'
    }).lean(); // Convert mongoose document to plain JavaScript object
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found or invalid seller ID'
      });
    }
    
    // Check if address and pin_code exist
    if (!seller.address || !seller.address.pin_code) {
      return res.status(400).json({
        success: false,
        message: 'Seller address or pin code is missing'
      });
    }
    
    // Extract seller's pincode
    const sellerPincode = seller.address.pin_code;
    
    // Find all customers in the same pincode
    const customers = await User.find({
      role: 'Customer',
      'address.pin_code': sellerPincode
    }).select('-password').lean(); // Exclude password and convert to plain objects
    
    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
    
  } catch (error) {
    console.error('Error in GET /sellers/:sellerId/customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


const getUsersInRegionalAdminRegion = async (req, res) => {
    try {
      // Access the correct parameter name
      const { regAdminId } = req.params;
      
      console.log('regAdminId:', regAdminId);
      
      if (!regAdminId) {
        return res.status(400).json({
          success: false,
          message: 'Admin ID is missing from request parameters'
        });
      }
  
      // Validate regAdminId format
      if (!mongoose.Types.ObjectId.isValid(regAdminId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid admin ID format: ${regAdminId}`
        });
      }
  
      // Find the regional admin to get their region
      const regionalAdmin = await User.findOne({
        _id: regAdminId,
        role: 'RegionalAdmin'
      }).lean();
      
      if (!regionalAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Regional admin not found or invalid admin ID'
        });
      }
      
      // Check if region exists
      if (!regionalAdmin.region) {
        return res.status(400).json({
          success: false,
          message: 'Admin region is missing'
        });
      }
      
      // Extract admin's region
      const adminRegion = regionalAdmin.region;
      
      // Find all users in the same region
      const users = await User.find({
        region: adminRegion,
        role:"Customer"
      }).select('-password').lean();
      
      return res.status(200).json({
        success: true,
        count: users.length,
        region: adminRegion,
        data: users
      });
      
    } catch (error) {
      console.error('Error in GET request:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  const getSellersInRegionalAdminRegion = async (req, res) => {
    try {
      // Access the correct parameter name
      const { regAdminId } = req.params;
      
      console.log('regAdminId:', regAdminId);
      
      if (!regAdminId) {
        return res.status(400).json({
          success: false,
          message: 'Admin ID is missing from request parameters'
        });
      }
  
      // Validate regAdminId format
      if (!mongoose.Types.ObjectId.isValid(regAdminId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid admin ID format: ${regAdminId}`
        });
      }
  
      // Find the regional admin to get their region
      const regionalAdmin = await User.findOne({
        _id: regAdminId,
        role: 'RegionalAdmin'
      }).lean();
      
      if (!regionalAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Regional admin not found or invalid admin ID'
        });
      }
      
      // Check if region exists
      if (!regionalAdmin.region) {
        return res.status(400).json({
          success: false,
          message: 'Admin region is missing'
        });
      }
      
      // Extract admin's region
      const adminRegion = regionalAdmin.region;
      
      // Find all users in the same region
      const users = await User.find({
        region: adminRegion,
        role:"Seller"
      }).select('-password').lean();
      
      return res.status(200).json({
        success: true,
        count: users.length,
        region: adminRegion,
        data: users
      });
      
    } catch (error) {
      console.error('Error in GET request:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };


module.exports = {
    createUser,
    getUsers,
    updateUser,
    deleteUser,
    getUserById,
    getCustomersInSellerPincode,
    getUsersInRegionalAdminRegion,
    getSellersInRegionalAdminRegion
};