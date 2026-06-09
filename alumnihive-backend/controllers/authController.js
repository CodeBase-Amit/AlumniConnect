const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@platform.admin').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const isUserApproved = (user) => {
  if (!user) {
    return false;
  }

  return Boolean(user.isApprovedByAdmin || user.isApproved);
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Ensure the configured platform admin account always exists and stays active.
const ensureConfiguredAdmin = async () => {
  let admin = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (!admin) {
    admin = await User.create({
      name: 'Platform Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      college: 'AlumniHive Platform',
      avatar: 'https://via.placeholder.com/150?text=Admin',
      bio: 'Platform Administrator',
      isVerified: true,
      isApproved: true,
      isApprovedByAdmin: true
    });

    return admin;
  }

  let shouldSave = false;

  if (admin.role !== 'admin') {
    admin.role = 'admin';
    shouldSave = true;
  }

  if (!admin.isVerified) {
    admin.isVerified = true;
    shouldSave = true;
  }

  if (!admin.isApproved || !admin.isApprovedByAdmin) {
    admin.isApproved = true;
    admin.isApprovedByAdmin = true;
    shouldSave = true;
  }

  const passwordMatches = await admin.comparePassword(ADMIN_PASSWORD);
  if (!passwordMatches) {
    admin.password = ADMIN_PASSWORD;
    shouldSave = true;
  }

  if (shouldSave) {
    await admin.save();
  }

  return admin;
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
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === ADMIN_EMAIL || role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is restricted'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user as verified but pending admin approval
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      college,
      role,
      department,
      graduationYear,
      isVerified: true,
      isApproved: false,
      isApprovedByAdmin: false,
      verificationToken: undefined,
      verificationTokenExpire: undefined
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
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

// @desc    Verify email (Deprecated)
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
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
    const normalizedEmail = email.toLowerCase().trim();

    // Admin login is restricted to one configured credential pair.
    if (normalizedEmail === ADMIN_EMAIL) {
      const admin = await ensureConfiguredAdmin();
      const adminWithPassword = await User.findById(admin._id).select('+password');
      const isMatch = await adminWithPassword.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      await adminWithPassword.updateLastActive();

      const token = generateToken(adminWithPassword._id);

      return res.json({
        success: true,
        token,
        user: {
          id: adminWithPassword._id,
          name: adminWithPassword.name,
          email: adminWithPassword.email,
          role: adminWithPassword.role,
          avatar: adminWithPassword.avatar,
          college: adminWithPassword.college,
          department: adminWithPassword.department,
          graduationYear: adminWithPassword.graduationYear
        }
      });
    }

    // Check for user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
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

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This admin account is not allowed to login'
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked by admin'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    if (!isUserApproved(user)) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval'
      });
    }

    await user.updateLastActive();

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
        graduationYear: user.graduationYear
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
