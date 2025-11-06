const Community = require('../models/Community');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all communities
// @route   GET /api/communities
// @access  Private
exports.getCommunities = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) {
      query.category = category;
    }

    // Filter private communities
    if (req.user.role !== 'admin') {
      query.$or = [
        { isPrivate: false },
        { 'members.user': req.user._id }
      ];
    }

    const communities = await Community.find(query)
      .populate('creator', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'stats.totalMembers': -1, createdAt: -1 });

    const count = await Community.countDocuments(query);

    res.json({
      success: true,
      communities,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCommunities: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Private
exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name avatar role')
      .populate('members.user', 'name avatar role')
      .populate('admins', 'name avatar')
      .populate('moderators', 'name avatar');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check access for private communities
    if (community.isPrivate && !community.isMember(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This community is private'
      });
    }

    res.json({
      success: true,
      community
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res) => {
  try {
    const {
      name, description, category, tags,
      isPrivate, requireApproval, rules
    } = req.body;

    const community = await Community.create({
      name,
      description,
      category,
      tags,
      isPrivate,
      requireApproval,
      rules,
      creator: req.user._id,
      admins: [req.user._id],
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    // Add to user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $push: { communities: community._id }
    });

    await community.populate('creator', 'name avatar');

    res.status(201).json({
      success: true,
      community
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    // Check if already a member
    if (community.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this community'
      });
    }

    if (community.requireApproval) {
      // Add to pending requests
      community.pendingRequests.push({
        user: req.user._id,
        message: req.body.message || ''
      });

      await community.save();

      // Notify admins
      for (const adminId of community.admins) {
        await Notification.create({
          recipient: adminId,
          sender: req.user._id,
          type: 'community_invite',
          title: 'New Join Request',
          message: `${req.user.name} wants to join ${community.name}`,
          link: `/communities/${community._id}/requests`
        });
      }

      return res.json({
        success: true,
        message: 'Join request sent. Waiting for approval.'
      });
    }

    // Add as member directly
    community.members.push({
      user: req.user._id,
      role: 'member'
    });

    await community.updateMemberCount();
    await community.save();

    // Add to user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $push: { communities: community._id }
    });

    res.json({
      success: true,
      message: 'Successfully joined the community',
      community
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    community.members = community.members.filter(
      m => m.user.toString() !== req.user._id.toString()
    );

    await community.updateMemberCount();
    await community.save();

    // Remove from user's communities
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { communities: community._id }
    });

    res.json({
      success: true,
      message: 'Successfully left the community'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};