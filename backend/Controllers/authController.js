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
    const users = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const user of users) {
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
        desc,
        complaints
      } = user;

      if (!name || !address || !gender || !date_of_birth || !e_mail ||
          !password || !phone_no || !region || !role) {
        results.push({
          success: false,
          message: "All fields are required",
          e_mail,
          phone_no
        });
        continue;
      }

      if (!address.first_line || !address.second_line || !address.city ||
          !address.state || !address.pin_code) {
        results.push({
          success: false,
          message: "All address fields are required",
          e_mail,
          phone_no
        });
        continue;
      }

      const numericPhone = typeof phone_no === 'string' ? parseInt(phone_no, 10) : phone_no;
      const numericPinCode = typeof address.pin_code === 'string' ? parseInt(address.pin_code, 10) : address.pin_code;

      if (isNaN(numericPhone) || isNaN(numericPinCode)) {
        results.push({
          success: false,
          message: "Phone number and pin code must be valid numbers",
          e_mail,
          phone_no
        });
        continue;
      }

      const formattedAddress = {
        first_line: address.first_line,
        second_line: address.second_line,
        city: address.city,
        state: address.state,
        pin_code: numericPinCode
      };

      const existingUser = await User.findOne({
        $or: [{ e_mail }, { phone_no: numericPhone }],
      });

      if (existingUser) {
        results.push({
          success: false,
          message: "User with this email or phone already exists",
          e_mail,
          phone_no
        });
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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

      switch (role) {
        case "Customer":
          userData.verification_status = "approved";
          userData.is_verified = true;
          newUser = await Customer.create(userData);
          break;

        case "Seller":
          const existingSellerInPincode = await Seller.findOne({
            'address.pin_code': numericPinCode,
            verification_status: { $in: ['approved', 'pending'] }
          });

          if (existingSellerInPincode) {
            results.push({
              success: false,
              message: "A seller already exists or is pending approval for this PIN code",
              e_mail,
              phone_no
            });
            continue;
          }

          newUser = await Seller.create({
            ...userData,
            desc: desc || "",
            complaints: complaints || "",
            orders: []
          });

          // await notifyRegionalAdmin(newUser, region);
          break;

        case "RegionalAdmin":
          newUser = new RegionalAdmin({
            ...userData,
            sellers: []
          });

          await newUser.save();
          // await notifySuperAdmin(newUser);
          break;

        default:
          results.push({
            success: false,
            message: "Invalid role",
            e_mail,
            phone_no
          });
          continue;
      }

      results.push({
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          role: newUser.role,
          phone_no: newUser.phone_no,
          verification_status:
            newUser.role === "Seller" ? newUser.verification_status : null,
        },
      });
    }

    return res.status(201).json({
      message: "Bulk registration result",
      results
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


exports.checkUserEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Check if user exists with this email
    const existingUser = await User.findOne({ e_mail: email });
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        isRegistered: true,
        message: "User with this email is registered",
        role: existingUser.role
      });
    } else {
      return res.status(200).json({
        success: true,
        isRegistered: false,
        message: "User with this email is not registered"
      });
    }
  } catch (error) {
    console.error("Error in checkUserEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Helper function to notify regional admin about new seller
// async function notifyRegionalAdmin(seller , region) {
//   try {
//     // Find regional admin for the seller's region
//     const regionalAdmin = await RegionalAdmin.findOne({
//       region: region,
//       verification_status: "approved",
//       is_verified: true
//     });

//     if (!regionalAdmin) {
      
//       console.error(`No approved regional admin found for region: ${region}`);
//       return;
//     }
//     await Notification.create({
//       user_id: regionalAdmin._id,
//       title: "New Seller Registration",
//       message: `A new seller "${seller.name}" has registered in your region and needs approval.`,
//       type: "approval_request",
//       data: {
//         seller_id: seller._id,
//         seller_name: seller.name,
//         pincode: seller.address.pin_code
//       },
//       is_read: false
//     });
//   } catch (error) {
//     console.error("Error notifying regional admin:", error);
//   }
// }

// async function notifySuperAdmin(regionalAdmin) {
//   try {
//     // Find the super admin 
//     const superAdmin = await User.findOne({ 
//       role: "SuperAdmin"
//     });
    
//     if (!superAdmin) {
//       console.error("No super admin found in the system");
//       return;
//     }
    
//     // Create a notification
//     await Notification.create({
//       user_id: superAdmin._id,
//       title: "New Regional Admin Registration",
//       message: `A new regional admin "${regionalAdmin.name}" has registered for ${regionalAdmin.region} region and needs approval.`,
//       type: "approval_request",
//       data: {
//         admin_id: regionalAdmin._id,
//         admin_name: regionalAdmin.name,
//         region: regionalAdmin.region
//       },
//       is_read: false
//     });
    
//     // Optionally, send an email notification
//     // await sendEmail(superAdmin.e_mail, "New Regional Admin Registration", `A new regional admin has registered...`);
//   } catch (error) {
//     console.error("Error notifying super admin:", error);
//   }
// }

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

    // Convert user document to a plain JavaScript object
    const userObject = user.toObject();
    
    // Generate JWT token with safe properties
    const token = jwt.sign(
      {
        user_id: userObject._id,
        role: userObject.role,
        phone_no: userObject.phone_no,
        region: userObject.region,
        email: userObject.e_mail
        // Don't include address in the token
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
        id: userObject._id,
        name: userObject.name,
        role: userObject.role,
        phone_no: userObject.phone_no,
        region: userObject.region,
        email: userObject.e_mail,
        verification_status: userObject.verification_status,
        // Only include address if it exists
        ...(userObject.address ? { address: userObject.address } : {})
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