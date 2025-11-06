const Message = require('../models/Message');

// @desc    Get community messages
// @route   GET /api/messages/community/:communityId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

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