const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin', 'community_admin', 'batch_admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  college: {
    type: String,
    required: [true, 'Please provide college name']
  },
  department: String,
  graduationYear: Number,
  currentCompany: String,
  currentPosition: String,
  skills: [String],
  interests: [String],
  linkedin: String,
  github: String,
  portfolio: String,
  
  // ✅ EMAIL VERIFICATION (NO LONGER REQUIRED FOR LOGIN)
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // ✅ ADMIN APPROVAL (REQUIRED FOR LOGIN)
  isApprovedByAdmin: {
    type: Boolean,
    default: false  // ❌ Needs admin approval to login
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  communities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  
  isMentor: {
    type: Boolean,
    default: false
  },
  mentorDetails: {
    expertise: [String],
    availability: String,
    maxMentees: {
      type: Number,
      default: 5
    },
    bio: String
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================

// Optimize queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isApprovedByAdmin: 1 });
UserSchema.index({ createdAt: -1 });

// ============================================
// METHODS
// ============================================

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last active
UserSchema.methods.updateLastActive = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Check if user can login
UserSchema.methods.canLogin = function() {
  // Admins can always login
  if (this.role === 'admin') {
    return true;
  }
  
  // Other users need admin approval
  return this.isApprovedByAdmin;
};

// Get public profile (without sensitive fields)
UserSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    college: this.college,
    department: this.department,
    graduationYear: this.graduationYear,
    currentCompany: this.currentCompany,
    currentPosition: this.currentPosition,
    skills: this.skills,
    interests: this.interests,
    linkedin: this.linkedin,
    github: this.github,
    portfolio: this.portfolio,
    role: this.role,
    isMentor: this.isMentor,
    createdAt: this.createdAt
  };
};

// ============================================
// STATICS
// ============================================

// Find users pending approval
UserSchema.statics.findPendingApprovals = function() {
  return this.find({
    isApprovedByAdmin: false,
    role: { $ne: 'admin' }
  }).sort({ createdAt: -1 });
};

// Find approved users
UserSchema.statics.findApprovedUsers = function() {
  return this.find({
    isApprovedByAdmin: true
  }).sort({ lastActive: -1 });
};

// Get dashboard stats
UserSchema.statics.getDashboardStats = async function() {
  const totalUsers = await this.countDocuments();
  const pendingApprovals = await this.countDocuments({ 
    isApprovedByAdmin: false,
    role: { $ne: 'admin' }
  });
  const approvedUsers = await this.countDocuments({ isApprovedByAdmin: true });
  const students = await this.countDocuments({ role: 'student' });
  const alumni = await this.countDocuments({ role: 'alumni' });
  const admins = await this.countDocuments({ role: 'admin' });
  const mentors = await this.countDocuments({ isMentor: true });

  return {
    totalUsers,
    pendingApprovals,
    approvedUsers,
    students,
    alumni,
    admins,
    mentors
  };
};

module.exports = mongoose.model('User', UserSchema);