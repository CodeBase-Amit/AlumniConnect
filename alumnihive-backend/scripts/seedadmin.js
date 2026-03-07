const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@platform.admin').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnihive');
    
    console.log('🔗 MongoDB Connected');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email:', adminExists.email);
      console.log('ID:', adminExists._id);
      process.exit(0);
    }

    const extraAdmins = await User.countDocuments({ role: 'admin' });
    if (extraAdmins > 0) {
      console.log('❌ One or more admin-role users already exist with a different email.');
      console.log('Please clean those users first to keep a single admin credential pair.');
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Platform Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Will be hashed by pre-save hook
      role: 'admin',
      college: 'AlumniHive Platform',
      avatar: 'https://via.placeholder.com/150?text=Admin',
      bio: 'Platform Administrator',
      isVerified: true,
      isApproved: true,
      isApprovedByAdmin: true,
      createdAt: new Date()
    });

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🆔 Admin ID:', admin._id);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
