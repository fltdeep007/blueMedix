
const User = require("../Models/User/User");


exports.getRegionalAdmins = async (req, res) => {
    try {
      // Verify super admin
      if (req.user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      
      // Find all approved regional admins using the User model
      const regionalAdmins = await User.find({
        role: "RegionalAdmin",
        verification_status: "approved"
      });
      
      return res.status(200).json({
        success: true,
        admins: regionalAdmins.map((admin) => ({
          id: admin._id,
          name: admin.name,
          email: admin.e_mail,
          region: admin.region,
          sellers_count: admin.sellers ? admin.sellers.length : 0,
        })),
      });
    } catch (error) {
      console.error("Error getting regional admins:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  };


exports.approveRegionalAdmin = async (req, res) => {
    try {
      // Verify super admin permission
      if (req.user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only Super Admin can approve Regional Admins",
        });
      }
  
      const { adminId } = req.params;
  
      // Find the regional admin by ID
      const admin = await User.findOne({ 
        _id: adminId, 
        role: "RegionalAdmin",
        verification_status: "pending" 
      });
  
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Regional Admin not found or already processed",
        });
      }
  
      // Update verification status
      admin.verification_status = "approved";
      admin.is_verified = true;
      admin.verified_by = req.user._id;
      admin.verification_date = new Date();
  
      await admin.save();
  
      // Optional: Send notification email to the regional admin
      // await sendApprovalEmail(admin.e_mail, admin.name);
  
      return res.status(200).json({
        success: true,
        message: "Regional Admin approved successfully",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.e_mail,
          region: admin.region,
        },
      });
    } catch (error) {
      console.error("Error approving regional admin:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  // Decline Regional Admin
  exports.declineRegionalAdmin = async (req, res) => {
    try {
      // Verify super admin permission
      if (req.user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only Super Admin can decline Regional Admins",
        });
      }
  
      const { adminId } = req.params;
      const { reason } = req.body; // Optional reason for rejection
  
      // Find the regional admin by ID
      const admin = await User.findOne({ 
        _id: adminId, 
        role: "RegionalAdmin",
        verification_status: "pending" 
      });
  
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Regional Admin not found or already processed",
        });
      }
  
      // Update verification status
      admin.verification_status = "rejected";
      admin.verified_by = req.user._id;
      admin.verification_date = new Date();
      
      // If you want to store the rejection reason
      if (reason) {
        admin.rejection_reason = reason;
      }
  
      await admin.save();
  
      // Optional: Send notification email to the regional admin
      // await sendRejectionEmail(admin.e_mail, admin.name, reason);
  
      return res.status(200).json({
        success: true,
        message: "Regional Admin application declined",
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.e_mail,
        },
      });
    } catch (error) {
      console.error("Error declining regional admin:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  // Get Pending Regional Admin Requests
  exports.getPendingRegionalAdmins = async (req, res) => {
    try {
      // Verify super admin permission
      if (req.user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
  
      const pendingAdmins = await User.find({
        role: "RegionalAdmin",
        verification_status: "pending"
      });
  
      return res.status(200).json({
        success: true,
        pendingAdmins: pendingAdmins.map((admin) => ({
          id: admin._id,
          name: admin.name,
          email: admin.e_mail,
          region: admin.region,
          application_date: admin.created_at,
        })),
      });
    } catch (error) {
      console.error("Error getting pending regional admins:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };