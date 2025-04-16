const User = require("../Models/User/User");
const Notification = require("../Models/User/Notification")
const Customer = require("../Models/User/Roles/Customer");
const Seller = require("../Models/User/Roles/Seller");
const RegionalAdmin = require("../Models/User/Roles/RegionalAdmin");
const SuperAdmin = require("../Models/User/SuperAdmin")
const firebase = require("firebase-admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Initialize Firebase Admin SDK
const serviceAccount = require("../config/key.json"); // You'll need to download this from Firebase
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

// Request OTP via Firebase
exports.requestOTP = async (req, res) => {
  try {
    const { mobile, code } = req.body;

    if (!mobile || !code) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and country code are required",
      });
    }

   
    const existingUser = await User.findOne({ phone_no: mobile });


    return res.status(200).json({
      success: true,
      message: "OTP sent successfully via Firebase",
      mobile: mobile,
      userExists: !!existingUser,
    });
  } catch (error) {
    console.error("Error in requestOTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { mobile, firebase_token } = req.body;

    if (!mobile || !firebase_token) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and Firebase token are required",
      });
    }

  
    const decodedToken = await firebase.auth().verifyIdToken(firebase_token);


    if (decodedToken.phone_number !== `+91${mobile}`) {
      console.log(
        "Phone mismatch:",
        decodedToken.phone_number,
        "vs",
        `+91${mobile}`
      );
      return res.status(403).json({
        success: false,
        message: "Phone number verification failed",
      });
    }

  
    const existingUser = await User.findOne({ phone_no: mobile });

    // Generate JWT token
    const token = jwt.sign(
      {
        phone_no: mobile,
        user_id: existingUser ? existingUser._id : null,
        role: existingUser ? existingUser.role : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: existingUser
        ? "User logged in successfully"
        : "Phone verified. Please complete registration",
      token: `Bearer ${token}`,
      user: existingUser
        ? {
            id: existingUser._id,
            name: existingUser.name,
            role: existingUser.role,
            phone_no: existingUser.phone_no,
            // Include verification status for sellers
            verification_status:
              existingUser.role === "Seller"
                ? existingUser.verification_status
                : null,
          }
        : null,
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Register a new user (after OTP verification)
exports.registerUser = async (req, res) => {
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
    } = req.body;

     // Verify the provided token to ensure the phone is verified
    // const token = req.headers.authorization?.split(" ")[1];
    // if (!token) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Authorization token required",
    //   });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if (decoded.phone_no !== phone_no.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Phone number does not match verified number",
    //   });
    // }
    // Validate required fields
    if (!name || !address || !gender || !date_of_birth || !e_mail || 
        !password || !phone_no || !region || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate address fields
    if (!address.first_line || !address.second_line || !address.city || 
        !address.state || !address.pin_code) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    // Convert string values to numbers
    const numericPhone = typeof phone_no === 'string' ? parseInt(phone_no, 10) : phone_no;
    const numericPinCode = typeof address.pin_code === 'string' ? 
      parseInt(address.pin_code, 10) : address.pin_code;

    if (isNaN(numericPhone) || isNaN(numericPinCode)) {
      return res.status(400).json({
        success: false,
        message: "Phone number and pin code must be valid numbers",
      });
    }

    // Create formatted address object with numeric pin_code
    const formattedAddress = {
      first_line: address.first_line,
      second_line: address.second_line,
      city: address.city,
      state: address.state,
      pin_code: numericPinCode
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ e_mail }, { phone_no: numericPhone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create base user data
    const userData = {
      name,
      address: formattedAddress,
      gender,
      date_of_birth: new Date(date_of_birth),
      e_mail,
      password: hashedPassword,
      phone_no: numericPhone,
      region,
      verification_status: "pending",
      is_verified: false,
      role
    };
    
    let newUser;

    // Create user based on role
    switch (role) {
      case "Customer":
        userData.verification_status = "approved";
        userData.is_verified = true;
        newUser = await Customer.create(userData);
        break;

      case "Seller":
        // Check if seller exists in pincode
        const existingSellerInPincode = await Seller.findOne({
          'address.pin_code': numericPinCode,
          verification_status: { $in: ['approved', 'pending'] }
        });
        
        if (existingSellerInPincode) {
          return res.status(409).json({
            success: false,
            message: "A seller already exists or is pending approval for this PIN code"
          });
        }
        
        newUser = await Seller.create({
          ...userData,
          desc: req.body.desc || "",
          complaints : req.body.complaints || ""
        });

        await notifyRegionalAdmin(newUser, region);
        break;

      case "RegionalAdmin":
       
        const regionalAdmin = new RegionalAdmin({
          ...userData,
          // Explicitly initialize arrays as empty
         
          sellers: []
        });
        
        // Save the document
        newUser = await regionalAdmin.save();
        await notifySuperAdmin(newUser);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
    }

    // Generate JWT token
    const newToken = jwt.sign(
      {
        phone_no: newUser.phone_no,
        user_id: newUser._id,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: newToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        phone_no: newUser.phone_no,
        verification_status:
          newUser.role === "Seller" ? newUser.verification_status : null,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: error.stack
    });
  }
};

// Helper function to notify regional admin about new seller
async function notifyRegionalAdmin(seller , region) {
  try {
    // Find regional admin for the seller's region
    const regionalAdmin = await RegionalAdmin.findOne({
      region: region,
      verification_status: "approved",
      is_verified: true
    });

    if (!regionalAdmin) {
      
      console.error(`No approved regional admin found for region: ${region}`);
      return;
    }
    await Notification.create({
      user_id: regionalAdmin._id,
      title: "New Seller Registration",
      message: `A new seller "${seller.name}" has registered in your region and needs approval.`,
      type: "approval_request",
      data: {
        seller_id: seller._id,
        seller_name: seller.name,
        pincode: seller.address.pin_code
      },
      is_read: false
    });
  } catch (error) {
    console.error("Error notifying regional admin:", error);
  }
}

async function notifySuperAdmin(regionalAdmin) {
  try {
    // Find the super admin 
    const superAdmin = await User.findOne({ 
      role: "SuperAdmin"
    });
    
    if (!superAdmin) {
      console.error("No super admin found in the system");
      return;
    }
    
    // Create a notification
    await Notification.create({
      user_id: superAdmin._id,
      title: "New Regional Admin Registration",
      message: `A new regional admin "${regionalAdmin.name}" has registered for ${regionalAdmin.region} region and needs approval.`,
      type: "approval_request",
      data: {
        admin_id: regionalAdmin._id,
        admin_name: regionalAdmin.name,
        region: regionalAdmin.region
      },
      is_read: false
    });
    
    // Optionally, send an email notification
    // await sendEmail(superAdmin.e_mail, "New Regional Admin Registration", `A new regional admin has registered...`);
  } catch (error) {
    console.error("Error notifying super admin:", error);
  }
}

// Super Admin functions
exports.createSuperAdmin = async (req, res) => {
  try {


    const { name, e_mail, password, phone_no } = req.body;

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });

    if (existingSuperAdmin) {
      return res.status(409).json({
        success: false,
        message: "Super Admin already exists",
      });
    }





    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Super Admin
    const superAdmin = await SuperAdmin.create({
      name,
      e_mail,
      password: hashedPassword,
      phone_no,
      address: {
        first_line: "Admin HQ",
        second_line: "Admin Building",
        city: "Admin City",
        state: "Admin State",
        pin_code: 100001,
      },
      verification_status: "approved",
      is_verified: true,
      verification_date: new Date(), // Current timestamp
      // Self-verification for SuperAdmin
      verified_by: null,
      gender: "other",
      date_of_birth: new Date("1990-01-01"),
      region: "All",
      access_level: "full",
      
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      admin:superAdmin
    });
  } catch (error) {
    console.error("Error creating Super Admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Regional Admin approval functions


exports.loginUser = async (req, res) => {
  try {
    const { e_mail, password } = req.body;

    // Validate request body
    if (!e_mail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ e_mail });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if user is verified (for seller and regional admin roles)
    if (user.role !== "Customer" && !user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending verification",
        verification_status: user.verification_status
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user._id,
        role: user.role,
        phone_no: user.phone_no
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return success response with token and basic user info
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: `Bearer ${token}`,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone_no: user.phone_no,
        verification_status: 
          user.role === "Seller" ? user.verification_status : null,
      }
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};