const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/emailVerification');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'  // Added fallback for JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, college, role, department, graduationYear } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user - Requires admin approval before login
    user = await User.create({
      name,
      email,
      password,
      college,
      role,
      department,
      graduationYear,
      isVerified: true,              // ✅ AUTO-VERIFIED (no email verification needed)
      isApproved: true,              // ✅ AUTO-APPROVED (for internal system)
      isApprovedByAdmin: false,       // ❌ NEEDS ADMIN APPROVAL TO LOGIN
      verificationToken: undefined,
      verificationTokenExpire: undefined
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. Please wait.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        college: user.college,
        department: user.department,
        graduationYear: user.graduationYear,
        isApprovedByAdmin: user.isApprovedByAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Verify email (DEPRECATED - KEPT FOR BACKWARD COMPATIBILITY)
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    // This endpoint is no longer used
    res.json({
      success: true,
      message: 'Email verification is no longer required. You can login directly.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ✅ NEW: Check admin approval (except for admins)
    // Admins can always login, but other users need admin approval first
    if (user.role !== 'admin' && !user.isApprovedByAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval before logging in.'
      });
    }

    // Update last active
    user.updateLastActive();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        college: user.college,
        department: user.department,
        graduationYear: user.graduationYear,
        isApprovedByAdmin: user.isApprovedByAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('communities', 'name avatar');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};