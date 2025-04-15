const User = require('../User');
const mongoose = require('mongoose');

const regionalAdminSchema = new mongoose.Schema({
  sellers: [{
    name: {
      type: String,
      required: true,
    }
  }]
});

const RegionalAdmin = User.discriminator('RegionalAdmin', regionalAdminSchema);
module.exports = RegionalAdmin;
