const User = require("../Models/User/User");

exports.getSellersPendingApproval = async (req, res) => {
  try {
    // Ensure user is a regional admin
    if (req.user.role !== 'RegionalAdmin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Regional Admins can view pending sellers"
      });
    }

    // Get the regional admin's region
    const adminId = req.user.user_id;
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Find all sellers in the admin's region with pending verification
    const pendingSellers = await User.find({
      role: "Seller",
      region: admin.region,
      verification_status: "pending",
    }).lean(); // Use lean() to get plain JavaScript objects instead of Mongoose documents

    return res.status(200).json({
      success: true,
      sellers: pendingSellers.map((seller) => {
        // Safely extract properties
        return {
          id: seller._id,
          name: seller.name || "",
          phone_no: seller.phone_no || "",
          e_mail: seller.e_mail || "",
          desc: seller.desc || "",
          region: seller.region || "",
          address: seller.address || {}
        };
      }),
    });
  } catch (error) {
    console.error("Error getting pending sellers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.approveSeller = async (req, res) => {
  try {
    // Ensure user is a regional admin
    if (req.user.role !== 'RegionalAdmin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Regional Admins can approve sellers"
      });
    }

    const { sellerId } = req.params;

    // Check if the regional admin has authority over this seller
    const admin = await User.findById(req.user.user_id);
    const seller = await User.findOne({
      _id: sellerId,
      role: "Seller"
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.region !== admin.region) {
      return res.status(403).json({
        success: false,
        message: "You do not have authority over sellers in this region",
      });
    }

    // Update seller verification status
    seller.verification_status = "approved";
    seller.is_verified = true;
    seller.verified_by = admin._id;
    seller.verification_date = new Date();
    await seller.save();

    // Add seller to admin's list of sellers if not already there
    if (!admin.sellers.includes(seller._id)) {
      admin.sellers.push(seller._id);
      await admin.save();
    }

    return res.status(200).json({
      success: true,
      message: "Seller approved successfully",
    });
  } catch (error) {
    console.error("Error approving seller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.rejectSeller = async (req, res) => {
  try {
    // Ensure user is a regional admin
    if (req.user.role !== 'RegionalAdmin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Regional Admins can reject sellers"
      });
    }

    const { sellerId } = req.params;
    const { reason } = req.body; // Extract the reason from request body

    // Check if the regional admin has authority over this seller
    const admin = await User.findById(req.user.user_id);
    const seller = await User.findOne({
      _id: sellerId,
      role: "Seller"
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (seller.region !== admin.region) {
      return res.status(403).json({
        success: false,
        message: "You do not have authority over sellers in this region",
      });
    }

    // Update seller verification status
    seller.verification_status = "rejected";
    seller.rejection_reason = reason || "No reason provided";
    seller.verified_by = admin._id;
    seller.verification_date = new Date();
    await seller.save();

    return res.status(200).json({
      success: true,
      message: "Seller application rejected",
    });
  } catch (error) {
    console.error("Error rejecting seller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Combined approve/reject seller registration
exports.processSellerApproval = async (req, res) => {
  try {
    // Ensure user is a regional admin
    if (req.user.role !== 'RegionalAdmin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Regional Admins can process seller applications"
      });
    }

    const { seller_id, status, reason } = req.body;
    
    // Check if valid status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }
    
    // Find seller and update status
    const admin = await User.findById(req.user.user_id);
    const seller = await User.findOne({
      _id: seller_id,
      role: "Seller"
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }
    
    // Check if seller is in admin's region
    if (seller.region !== admin.region) {
      return res.status(403).json({
        success: false,
        message: "You can only process sellers in your region"
      });
    }
    
    // Update seller status
    seller.verification_status = status;
    seller.is_verified = status === 'approved';
    seller.verified_by = admin._id;
    seller.verification_date = new Date();
    
    if (status === 'rejected' && reason) {
      seller.rejection_reason = reason;
    }
    
    await seller.save();
    
    // If approved, add to admin's sellers list
    if (status === 'approved' && !admin.sellers.includes(seller._id)) {
      admin.sellers.push(seller._id);
      await admin.save();
    }
    
    // Notify seller about approval status (implement as needed)
    // Implementation of seller notification
    
    return res.status(200).json({
      success: true,
      message: `Seller ${status === 'approved' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error("Error in processSellerApproval:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all approved sellers in the admin's region
exports.getApprovedSellers = async (req, res) => {
  try {
    // Ensure user is a regional admin
    if (req.user.role !== 'RegionalAdmin') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only Regional Admins can view sellers"
      });
    }

    const admin = await User.findById(req.user.user_id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    
    const approvedSellers = await User.find({
      role: "Seller",
      region: admin.region,
      verification_status: "approved"
    });
    
    return res.status(200).json({
      success: true,
      sellers: approvedSellers.map(seller => ({
        id: seller._id,
        name: seller.name,
        phone_no: seller.phone_no,
        e_mail: seller.e_mail,
        desc: seller.desc,
        address: seller.address
      }))
    });
  } catch (error) {
    console.error("Error getting approved sellers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};