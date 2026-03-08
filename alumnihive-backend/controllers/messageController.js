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
      deletedFor: { $ne: req.user._id },
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

    await Message.updateMany(
      {
        isPrivate: true,
        sender: userId,
        receiver: req.user._id,
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

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

// @desc    Delete a private message for current user
// @route   DELETE /api/messages/private/:messageId
// @access  Private
exports.deletePrivateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      isPrivate: true,
      isDeleted: false,
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await Message.findByIdAndUpdate(message._id, {
      $addToSet: { deletedFor: req.user._id }
    });

    const refreshed = await Message.findById(message._id).select('sender receiver deletedFor isPrivate');
    const senderId = refreshed.sender?.toString();
    const receiverId = refreshed.receiver?.toString();
    const isDeletedForSender = refreshed.deletedFor?.some((id) => id.toString() === senderId);
    const isDeletedForReceiver = refreshed.deletedFor?.some((id) => id.toString() === receiverId);

    if (isDeletedForSender && isDeletedForReceiver) {
      refreshed.isDeleted = true;
      await refreshed.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('message:private:deleted', {
        messageIds: [messageId],
        deletedBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
      deletedIds: [messageId]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Bulk delete private messages for current user
// @route   POST /api/messages/private/bulk-delete
// @access  Private
exports.bulkDeletePrivateMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messageIds must be a non-empty array'
      });
    }

    const privateMessages = await Message.find({
      _id: { $in: messageIds },
      isPrivate: true,
      isDeleted: false,
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    }).select('_id sender receiver deletedFor');

    if (privateMessages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching private messages found'
      });
    }

    const validIds = privateMessages.map((msg) => msg._id);

    await Message.updateMany(
      { _id: { $in: validIds } },
      { $addToSet: { deletedFor: req.user._id } }
    );

    const refreshedMessages = await Message.find({ _id: { $in: validIds } })
      .select('_id sender receiver deletedFor isDeleted');

    const idsToFullyDelete = [];
    refreshedMessages.forEach((msg) => {
      const senderId = msg.sender?.toString();
      const receiverId = msg.receiver?.toString();
      const isDeletedForSender = msg.deletedFor?.some((id) => id.toString() === senderId);
      const isDeletedForReceiver = msg.deletedFor?.some((id) => id.toString() === receiverId);

      if (isDeletedForSender && isDeletedForReceiver) {
        idsToFullyDelete.push(msg._id);
      }
    });

    if (idsToFullyDelete.length > 0) {
      await Message.updateMany(
        { _id: { $in: idsToFullyDelete } },
        { $set: { isDeleted: true } }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('message:private:deleted', {
        messageIds: validIds.map((id) => id.toString()),
        deletedBy: req.user._id
      });
    }

    res.json({
      success: true,
      message: 'Selected messages deleted successfully',
      deletedIds: validIds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};