const express = require("express");
const router = express.Router();
const { getCustomersInSellerPincode , getUsersInRegionalAdminRegion , getUsersInSellerRegion} = require('../Controllers/userController')

router.get('/seller/:sellerId' , getCustomersInSellerPincode)
router.get('/regAdmin/customers/:regAdminId' , getUsersInRegionalAdminRegion)
router.get('/regAdmin/sellers/:regAdminId' , getUsersInRegionalAdminRegion)