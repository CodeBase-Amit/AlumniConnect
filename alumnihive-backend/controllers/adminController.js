const User = require('../models/User');
const Blog = require('../models/Blog');
const Question = require('../models/Question');
const Community = require('../models/Community');
const Notification = require('../models/Notification');
const ModerationLog = require('../models/ModerationLog');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@platform.admin').toLowerCase();

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const createLog = async ({ targetType, targetId, action, reason, metadata, actor }) => {
  await ModerationLog.create({
    targetType,
    targetId,
    action,
    reason,
    metadata: metadata || {},
    actor
  });
};

const sendModerationNotification = async ({ recipient, sender, title, message, link }) => {
  await Notification.create({
    recipient,
    sender,
    type: 'system',
    title,
    message,
    link
  });
};

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
    user.isApproved = true;
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    await user.save();

    await createLog({
      targetType: 'user',
      targetId: user._id,
      action: 'approve',
      reason: 'Approved by admin',
      actor: req.user._id
    });

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

    await createLog({
      targetType: 'user',
      targetId: user._id,
      action: 'reject',
      reason: reason || 'Rejected by admin',
      actor: req.user._id
    });

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
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const students = await User.countDocuments({ role: 'student' });
    const alumni = await User.countDocuments({ role: 'alumni' });
    const totalBlogs = await Blog.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalCommunities = await Community.countDocuments();
    const blockedBlogs = await Blog.countDocuments({ isBlocked: true });
    const blockedQuestions = await Question.countDocuments({ isBlocked: true });
    const blockedCommunities = await Community.countDocuments({ isBlocked: true });

    res.json({
      success: true,
      stats: {
        totalUsers,
        pendingApprovals,
        approvedUsers,
        blockedUsers,
        students,
        alumni,
        totalBlogs,
        totalQuestions,
        totalCommunities,
        blockedBlogs,
        blockedQuestions,
        blockedCommunities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List users with filters
exports.getUsers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'pending') {
      query.isApprovedByAdmin = false;
    }

    if (status === 'approved') {
      query.isApprovedByAdmin = true;
      query.isBlocked = false;
    }

    if (status === 'blocked') {
      query.isBlocked = true;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email?.toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Cannot block configured admin account' });
    }

    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.blockReason = reason || 'Blocked by admin';
    await user.save();

    await createLog({
      targetType: 'user',
      targetId: user._id,
      action: 'block',
      reason: user.blockReason,
      actor: req.user._id
    });

    await sendModerationNotification({
      recipient: user._id,
      sender: req.user._id,
      title: 'Account Blocked',
      message: user.blockReason,
      link: '/login'
    });

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBlocked = false;
    user.blockedAt = undefined;
    user.blockedBy = undefined;
    user.blockReason = undefined;
    await user.save();

    await createLog({
      targetType: 'user',
      targetId: user._id,
      action: 'unblock',
      reason: reason || 'Unblocked by admin',
      actor: req.user._id
    });

    await sendModerationNotification({
      recipient: user._id,
      sender: req.user._id,
      title: 'Account Unblocked',
      message: reason || 'Your account access has been restored.',
      link: '/login'
    });

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getContentModel = (type) => {
  if (type === 'blogs') {
    return { model: Blog, targetType: 'blog', populate: 'author', link: '/blogs' };
  }
  if (type === 'questions') {
    return { model: Question, targetType: 'question', populate: 'author', link: '/questions' };
  }
  if (type === 'communities') {
    return { model: Community, targetType: 'community', populate: 'creator', link: '/communities' };
  }
  return null;
};

// List content for moderation
exports.getContentList = async (req, res) => {
  try {
    const { type } = req.params;
    const { search, status } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const mapping = getContentModel(type);
    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const query = {};
    if (search) {
      query[type === 'communities' ? 'name' : 'title'] = { $regex: search, $options: 'i' };
    }

    if (status === 'blocked') {
      query.isBlocked = true;
    }

    if (status === 'active') {
      query.isBlocked = false;
    }

    const [items, total] = await Promise.all([
      mapping.model.find(query)
        .populate(mapping.populate, 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      mapping.model.countDocuments(query)
    ]);

    res.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Block/unblock content
exports.toggleContentBlock = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason, blocked } = req.body;
    const mapping = getContentModel(type);

    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const item = await mapping.model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isBlocked = Boolean(blocked);
    item.moderationReason = reason || (item.isBlocked ? 'Blocked by admin' : 'Unblocked by admin');
    item.moderatedAt = new Date();
    item.moderatedBy = req.user._id;

    if (Object.prototype.hasOwnProperty.call(item, 'isActive') && item.isBlocked) {
      item.isActive = false;
    }

    if (Object.prototype.hasOwnProperty.call(item, 'isPublished') && item.isBlocked) {
      item.isPublished = false;
    }

    await item.save();

    await createLog({
      targetType: mapping.targetType,
      targetId: item._id,
      action: item.isBlocked ? 'block' : 'unblock',
      reason: item.moderationReason,
      actor: req.user._id
    });

    res.json({ success: true, message: item.isBlocked ? 'Item blocked' : 'Item unblocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Feature/unfeature content
exports.toggleContentFeature = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { featured } = req.body;
    const mapping = getContentModel(type);

    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const item = await mapping.model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isFeatured = Boolean(featured);
    item.moderatedAt = new Date();
    item.moderatedBy = req.user._id;
    await item.save();

    await createLog({
      targetType: mapping.targetType,
      targetId: item._id,
      action: item.isFeatured ? 'feature' : 'unfeature',
      reason: item.isFeatured ? 'Featured by admin' : 'Unfeatured by admin',
      actor: req.user._id
    });

    res.json({ success: true, message: item.isFeatured ? 'Item featured' : 'Item unfeatured' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark content with moderation tag
exports.markContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { tag, reason } = req.body;
    const mapping = getContentModel(type);

    if (!mapping) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    const allowedTags = ['none', 'spam', 'abuse', 'duplicate', 'other'];
    if (!allowedTags.includes(tag)) {
      return res.status(400).json({ success: false, message: 'Invalid moderation tag' });
    }

    const item = await mapping.model.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.moderationTag = tag;
    item.moderationReason = reason || 'Marked by admin';
    item.moderatedAt = new Date();
    item.moderatedBy = req.user._id;
    await item.save();

    await createLog({
      targetType: mapping.targetType,
      targetId: item._id,
      action: 'mark',
      reason: item.moderationReason,
      metadata: { tag },
      actor: req.user._id
    });

    res.json({ success: true, message: 'Item marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get moderation logs
exports.getModerationLogs = async (req, res) => {
  try {
    const { targetType, action } = req.query;
    const { page, limit, skip } = parsePagination(req);

    const query = {};
    if (targetType) {
      query.targetType = targetType;
    }
    if (action) {
      query.action = action;
    }

    const [logs, total] = await Promise.all([
      ModerationLog.find(query)
        .populate('actor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ModerationLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};