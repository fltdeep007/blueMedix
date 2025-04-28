const User = require('../Models/User/User');

const createUser = async (userData) => {
    try {
        const user = await User.create(userData);
        return user;
    } catch (error) {
        throw new Error('Error creating user');
    }
};

const updateUserById = async (userId, userData) => {
    try {
      const { name, e_mail, phoneNumber, gender, dob } = userData;
      const updateFields = {};
  
      if (name) {
        updateFields.name = name;
      }
      if (e_mail) {
        updateFields.e_mail = e_mail;
      }
      if (phoneNumber) {
        if (!/^\d{10}$/.test(phoneNumber)) {
          throw new Error('Invalid phone number format. Must be 10 digits.');
        }
        updateFields.phoneNumber = phoneNumber;
      }
      if (gender) {
        updateFields.gender = gender;
      }
      if (dob) {
        updateFields.dob = dob;
      }
  
      const user = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true, runValidators: true });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  };
  
  const deleteUser = async (userId) => {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error('Error deleting user');
    }
  };
const getUserById = async (userId) => {
    try{
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;    
    }
    catch (error) {
        throw new Error('Error retrieving user');
    }
};

const getAllUsers = async () => {
    try {
      const users = await User.find({ role: "Customer" });
        return users;
    } catch (error) {
        throw new Error('Error retrieving users');
    }
};

module.exports = {
    createUser,
    updateUserById,
    getUserById,
    getAllUsers,
    deleteUser
};
