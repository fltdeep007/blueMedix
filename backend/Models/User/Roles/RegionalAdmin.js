const mongoose = require('mongoose');
const User = require('../User'); // Adjust path as needed

// Define a simpler schema for RegionalAdmin
const regionalAdminSchema = new mongoose.Schema({
  // Define managed_pincodes as plain array of numbers without any special options

  
  // Define sellers as plain array of objects
  sellers: [{
    name: String
  }]
});

// Create the model using discriminator pattern
const RegionalAdmin = User.discriminator('RegionalAdmin', regionalAdminSchema);

module.exports = RegionalAdmin;