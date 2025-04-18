// authMiddleware.js
const jwt = require('jsonwebtoken');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided or invalid format. Expected 'Bearer [token]'"
      });
    }
    
    // Extract token - use trim() to handle any extra spaces
    const token = authHeader.split(' ')[1].trim();
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Token is empty"
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request object
    req.user = decoded;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
};