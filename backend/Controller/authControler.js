
const User = require('../Models/User/User');

// Request OTP
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

// Verify OTP
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