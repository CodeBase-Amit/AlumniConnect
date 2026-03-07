const Message = require('../models/Message');
const Community = require('../models/Community');

// @desc    Get community messages
// @route   GET /api/messages/community/:communityId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    const isMember = community.isMember(req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access community messages'
      });
    }

    const messages = await Message.find({
      community: communityId,
      isDeleted: false
    })
      .populate('sender', 'name avatar role')
      .populate('replyTo', 'content sender')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get private messages
// @route   GET /api/messages/private/:userId
// @access  Private
exports.getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      isPrivate: true,
      isDeleted: false,
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};