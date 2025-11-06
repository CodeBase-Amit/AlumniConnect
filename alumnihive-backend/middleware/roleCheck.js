const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

const checkCommunityRole = (Community) => {
  return async (req, res, next) => {
    try {
      const communityId = req.params.communityId || req.body.communityId;
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          message: 'Community ID is required'
        });
      }

      const community = await Community.findById(communityId);

      if (!community) {
        return res.status(404).json({
          success: false,
          message: 'Community not found'
        });
      }

      // Check if user is admin or moderator
      const isAdmin = community.admins.some(
        admin => admin.toString() === req.user._id.toString()
      );
      
      const isModerator = community.moderators.some(
        mod => mod.toString() === req.user._id.toString()
      );

      if (!isAdmin && !isModerator && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to perform this action in this community'
        });
      }

      req.community = community;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking community role'
      });
    }
  };
};

module.exports = { checkRole, checkCommunityRole };