const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumnihive');
    
    console.log('🔗 MongoDB Connected');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@platform.admin' });
    
    if (adminExists) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email:', adminExists.email);
      console.log('ID:', adminExists._id);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user
    const admin = await User.create({
      name: 'Platform Admin',
      email: 'admin@platform.admin',
      password: 'Admin@123', // Will be hashed by pre-save hook
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
    console.log('🔑 Password: Admin@123');
    console.log('🆔 Admin ID:', admin._id);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();