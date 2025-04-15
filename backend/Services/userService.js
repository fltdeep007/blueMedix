const User = require('../Models/userModel');

const createUser = async (userData) => {
    try {
        const user = await User.create(userData);
        return user;
    } catch (error) {
        throw new Error('Error creating user');
    }
};

const updateUser = async (userId, userData) => {
    try {
        const user = await User.findByIdAndUpdate(userId, userData, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    catch (error) {
        throw new Error('Error updating user');
    }
};

const deleteUser = async (userId) => {
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
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
        const users = await User.find();
        return users;
    } catch (error) {
        throw new Error('Error retrieving users');
    }
};

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    getAllUsers
};
