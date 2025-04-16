
const User = require('./User');
const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
 
  access_level: {
    type: String,
    default: 'full',
    enum: ['full', 'limited']
  }
});

const SuperAdmin = User.discriminator('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;