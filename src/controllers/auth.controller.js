import User from "../models/user.model.js";
import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";

import OTP from "../models/otp.model.js";
import Blacklist from "../models/blacklist.model.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../config/mail.js";

// GET /api/auth/
export const home = (req, res) => {
    res.status(200).json({message: "Backend Server is Running"});
};

//register

export const register = async (req, res) => {
    try {
    const { username, email, password, role } = req.body;
    console.log("Received registration data:", { username, email, role });
        // 1. Check if already registered
        const isAlreadyRegistered = await User.findOne({ $or: [{ email }, { username }] });
        if (isAlreadyRegistered) {
            return res.status(409).json({ message: "User already registered" });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({ username, email, password: hashedPassword, role: role || 'user' });

    // 4. Generate access token
    const accessToken = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: "15m" }
    );

    res.status(201).json({ 
        message: "User registered successfully", 
        user: { username: user.username, email: user.email, role: user.role },
        accessToken 
    });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//login
export const login = async (req, res) => {
  try {

    // get data from body
    const { email, password } = req.body;
    
    // check user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // compare password
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
    });

  } catch (error) {

    console.log("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//logout
export const logout = async (req, res) => {
  try {
    const token = req.token; // Extracted in verifyToken middleware

    // Add token to blacklist
    await Blacklist.create({ token });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

//sendotp
export const sendOtp = async (req, res) => {
  try { 
    const { email } = req.body;
  

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate OTP
    const otp = generateOtp();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete old OTP
    await OTP.deleteMany({ email });

    // Save new OTP
    await OTP.create({
      email,
      otp: hashedOtp,
    });

    // Send Email
    // ALWAYS sending to rbpatade98@gmail.com for testing purposes as requested
    await sendEmail(
      "rbpatade98@gmail.com",
      "Your OTP Code",
      `
        <h2>Your OTP is: ${otp}</h2>
        <p>Valid for 5 minutes</p>
        <p><small>Note: This OTP was requested for account: ${email}</small></p>
      `
    );

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

//verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid",
      });
    }

    // Strict 5-minute validity check
    const isExpired = Date.now() - otpRecord.createdAt.getTime() > 5 * 60 * 1000;
    if (isExpired) {
      await OTP.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: "OTP has expired (exceeded 5 minutes)",
      });
    }

    const isOtpCorrect = await bcrypt.compare(
      otp,
      otpRecord.otp
    );

    if (!isOtpCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // We DO NOT delete the OTP here, so you can still use it for /reset-password within the 5 minutes!
    
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

//reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }

    // Strict 5-minute validity check
    const isExpired = Date.now() - otpRecord.createdAt.getTime() > 5 * 60 * 1000;
    if (isExpired) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ success: false, message: "OTP has expired (exceeded 5 minutes)" });
    }

    const isOtpCorrect = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpCorrect) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Delete OTP
    await OTP.deleteMany({ email });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
};