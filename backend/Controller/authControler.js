// Controller/authController.js

const User = require('../Models/User/User');
const Customer = require('../Models/User/Roles/Customer');
const Seller = require('../Models/User/Roles/Seller');
const RegionalAdmin = require('../Models/User/Roles/RegionalAdmin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Existing OTP functions remain the same
exports.requestOTP = async (req, res) => {
  try {
    const { mobile, code } = req.body;
    
    if (!mobile || !code) {
      return res.status(400).json({ success: false, message: 'Mobile number and country code are required' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      mobile: mobile,
      // In production, don't return the OTP
      otp: otp
    });
  } catch (error) {
    console.error('Error in requestOTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }
    
    const token = 'sample-jwt-token-' + Date.now();
    
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: token
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Updated signup function
exports.signup = async (req, res) => {
  try {
    const {
      name,
      address,
      gender,
      date_of_birth,
      e_mail,
      password,
      phone_no,
      region,
      role,
      // Role-specific fields
      // For Customer
      cart,
      // For Seller
      desc,
      complaints,
      orders,
      // For RegionalAdmin
      sellers
    } = req.body;

    // Check if required fields are present
    if (!name || !address || !gender || !date_of_birth || !e_mail || !password || !phone_no || !region || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ e_mail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create base user data
    const userData = {
      name,
      address,
      gender,
      date_of_birth,
      e_mail,
      password: hashedPassword,
      phone_no,
      region,
      verification_status: 'unverified' // Default status
    };

    let newUser;
    let requiresVerification = false;
    let verifierRole = null;
    
    // Create user based on role
    switch (role.toLowerCase()) {
      case 'customer':
        // Customers don't require verification
        newUser = new Customer({
          ...userData,
          cart: cart || [],
          verification_status: 'verified' // Auto-verify customers
        });
        break;
      
      case 'seller':
        // Sellers require verification by Regional Admin
        newUser = new Seller({
          ...userData,
          desc: desc || '',
          complaints: complaints || '',
          orders: orders || []
        });
        requiresVerification = true;
        verifierRole = 'RegionalAdmin';
        break;
      
      case 'regionaladmin':
        // Regional admins require verification by Super Admin
        newUser = new RegionalAdmin({
          ...userData,
          sellers: sellers || []
        });
        requiresVerification = true;
        verifierRole = 'SuperAdmin';
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role specified. Must be customer, seller, or regionaladmin' 
        });
    }

    // Save the user
    await newUser.save();

    // Generate JWT token - only for customers who don't need verification
    let token = null;
    if (!requiresVerification) {
      token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
    }

    return res.status(201).json({
      success: true,
      message: requiresVerification ? 
        `Registration successful. Your account is pending verification by a ${verifierRole}.` : 
        'Registration successful. Your account is now active.',
      requiresVerification,
      verifierRole,
      token, // Will be null for sellers and admins
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.e_mail,
        role: newUser.role,
        verificationStatus: newUser.verification_status
      }
    });
  } catch (error) {
    console.error('Error in signup:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify account based on hierarchy
exports.verifyAccount = async (req, res) => {
  try {
    // Get verification information
    const { userId } = req.params;
    const { verificationAction } = req.body; // 'approve' or 'reject'
    
    // Get details of the user making the verification (verifier)
    const verifierId = req.user.id; // Assuming authentication middleware sets this
    const verifier = await User.findById(verifierId);
    
    if (!verifier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verifier account not found' 
      });
    }
    
    // Get the user to be verified
    const userToVerify = await User.findById(userId);
    if (!userToVerify) {
      return res.status(404).json({ 
        success: false, 
        message: 'User account not found' 
      });
    }
    
    // Check appropriate permissions based on role hierarchy
    let canVerify = false;
    
    if (userToVerify.role === 'Seller' && verifier.role === 'RegionalAdmin') {
      // Regional Admin can verify Sellers
      canVerify = true;
    } else if (userToVerify.role === 'RegionalAdmin' && verifier.role === 'SuperAdmin') {
      // Super Admin can verify Regional Admins
      canVerify = true;
    } else if (userToVerify.verification_status === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'This account is already verified' 
      });
    }
    
    if (!canVerify) {
      return res.status(403).json({ 
        success: false, 
        message: `As a ${verifier.role}, you cannot verify a ${userToVerify.role} account` 
      });
    }
    
    // Process verification action
    if (verificationAction === 'approve') {
      userToVerify.verification_status = 'verified';
      
      // If verifying a seller, add to the regional admin's sellers list
      if (userToVerify.role === 'Seller' && verifier.role === 'RegionalAdmin') {
        // Check if the seller is already in the list
        const sellerExists = verifier.sellers.some(s => s.name === userToVerify.name);
        
        if (!sellerExists) {
          verifier.sellers.push({ name: userToVerify.name });
          await verifier.save();
        }
      }
    } else if (verificationAction === 'reject') {
      userToVerify.verification_status = 'rejected';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Verification action must be either 'approve' or 'reject'" 
      });
    }
    
    await userToVerify.save();
    
    // Generate token if account is verified
    let token = null;
    if (userToVerify.verification_status === 'verified') {
      token = jwt.sign(
        { userId: userToVerify._id, role: userToVerify.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
    }
    
    return res.status(200).json({ 
      success: true, 
      message: verificationAction === 'approve' ? 
        'Account verified successfully' : 
        'Account verification rejected',
      token, // Will be null if rejected
      user: {
        id: userToVerify._id,
        name: userToVerify.name,
        email: userToVerify.e_mail,
        role: userToVerify.role,
        verificationStatus: userToVerify.verification_status
      }
    });
  } catch (error) {
    console.error('Error in verifyAccount:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// For users to check their verification status
exports.checkVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Determine who needs to verify this account
    let verifierRole = null;
    if (user.verification_status === 'unverified') {
      if (user.role === 'Seller') {
        verifierRole = 'RegionalAdmin';
      } else if (user.role === 'RegionalAdmin') {
        verifierRole = 'SuperAdmin';
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      verificationStatus: user.verification_status,
      role: user.role,
      verifierRole,
      message: user.verification_status === 'unverified' ?
        `Your account is pending verification by a ${verifierRole}.` :
        user.verification_status === 'verified' ?
        'Your account is verified and active.' :
        'Your account verification was rejected.'
    });
  } catch (error) {
    console.error('Error in checkVerificationStatus:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get pending verification requests based on user role
exports.getPendingVerifications = async (req, res) => {
  try {
    const verifierId = req.user.id; // Assuming authentication middleware sets this
    const verifier = await User.findById(verifierId);
    
    if (!verifier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verifier account not found' 
      });
    }
    
    let query = { verification_status: 'unverified' };
    
    // Filter accounts based on verifier's role
    if (verifier.role === 'RegionalAdmin') {
      // Regional admins can only verify sellers
      query.role = 'Seller';
      
      // Optional: Filter by region if needed
      query.region = verifier.region;
    } else if (verifier.role === 'SuperAdmin') {
      // Super admins can only verify regional admins
      query.role = 'RegionalAdmin';
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to verify accounts' 
      });
    }
    
    const pendingAccounts = await User.find(query).select('_id name e_mail role region created_at');
    
    return res.status(200).json({ 
      success: true, 
      pendingAccounts
    });
  } catch (error) {
    console.error('Error in getPendingVerifications:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};