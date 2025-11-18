const User = require('../models/User');
const Notification = require('../models/Notification');

// Get all pending approvals
exports.getPendingApprovals = async (req, res) => {
  try {
    const users = await User.find({ isApprovedByAdmin: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isApprovedByAdmin = true;
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    await user.save();

    // Send notification to user
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'approval',
      title: 'Account Approved',
      message: 'Your account has been approved. You can now login!',
      link: '/login'
    });

    res.json({
      success: true,
      message: 'User approved successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reject user
exports.rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.userId);

    // Send notification
    await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'rejection',
      title: 'Account Rejected',
      message: `Your account has been rejected. Reason: ${reason}`,
      link: '/login'
    });

    res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingApprovals = await User.countDocuments({ isApprovedByAdmin: false });
    const approvedUsers = await User.countDocuments({ isApprovedByAdmin: true });
    const students = await User.countDocuments({ role: 'student' });
    const alumni = await User.countDocuments({ role: 'alumni' });

    res.json({
      success: true,
      stats: {
        totalUsers,
        pendingApprovals,
        approvedUsers,
        students,
        alumni
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};