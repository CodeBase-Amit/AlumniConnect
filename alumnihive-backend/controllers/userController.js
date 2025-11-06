const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { search, role, college, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (college) {
      query.college = college;
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('communities', 'name avatar description');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      name, bio, department, graduationYear,
      currentCompany, currentPosition, skills,
      interests, linkedin, github, portfolio
    } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (department) user.department = department;
    if (graduationYear) user.graduationYear = graduationYear;
    if (currentCompany) user.currentCompany = currentCompany;
    if (currentPosition) user.currentPosition = currentPosition;
    if (skills) user.skills = skills;
    if (interests) user.interests = interests;
    if (linkedin) user.linkedin = linkedin;
    if (github) user.github = github;
    if (portfolio) user.portfolio = portfolio;

    await user.save();

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

// @desc    Get mentors
// @route   GET /api/users/mentors
// @access  Private
exports.getMentors = async (req, res) => {
  try {
    const { expertise, search, page = 1, limit = 20 } = req.query;

    const query = { isMentor: true, role: 'alumni' };

    if (expertise) {
      query['mentorDetails.expertise'] = { $in: [expertise] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'mentorDetails.bio': { $regex: search, $options: 'i' } }
      ];
    }

    const mentors = await User.find(query)
      .select('name avatar bio role mentorDetails currentCompany currentPosition')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      mentors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalMentors: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Become a mentor
// @route   POST /api/users/become-mentor
// @access  Private (Alumni only)
exports.becomeMentor = async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({
        success: false,
        message: 'Only alumni can become mentors'
      });
    }

    const { expertise, availability, maxMentees, bio } = req.body;

    const user = await User.findById(req.user._id);

    user.isMentor = true;
    user.mentorDetails = {
      expertise,
      availability,
      maxMentees: maxMentees || 5,
      bio
    };

    await user.save();

    res.json({
      success: true,
      message: 'You are now a mentor!',
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

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      unreadCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};