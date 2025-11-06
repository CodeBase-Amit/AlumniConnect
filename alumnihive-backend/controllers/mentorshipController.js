const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send mentorship request
// @route   POST /api/mentorship/request
// @access  Private
exports.sendMentorshipRequest = async (req, res) => {
  try {
    const { mentorId, requestMessage, goals, skills } = req.body;

    const mentor = await User.findById(mentorId);

    if (!mentor || !mentor.isMentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    const mentorship = await Mentorship.create({
      mentor: mentorId,
      mentee: req.user._id,
      requestMessage,
      goals,
      skills,
      status: 'pending'
    });

    // Notify mentor
    await Notification.create({
      recipient: mentorId,
      sender: req.user._id,
      type: 'mentorship_request',
      title: 'New Mentorship Request',
      message: `${req.user.name} sent you a mentorship request`,
      link: `/mentorship/requests`
    });

    await mentorship.populate('mentee', 'name avatar email');

    res.status(201).json({
      success: true,
      mentorship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get mentorship requests
// @route   GET /api/mentorship/requests
// @access  Private
exports.getMentorshipRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({
      mentor: req.user._id,
      status: 'pending'
    })
      .populate('mentee', 'name avatar email college')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Respond to mentorship request
// @route   PUT /api/mentorship/requests/:id/respond
// @access  Private
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // accepted or rejected

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship request not found'
      });
    }

    if (mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    mentorship.status = status;
    if (status === 'accepted') {
      mentorship.startDate = Date.now();
    }

    await mentorship.save();

    // Notify mentee
    await Notification.create({
      recipient: mentorship.mentee,
      sender: req.user._id,
      type: 'mentorship_accepted',
      title: `Mentorship Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `${req.user.name} ${status === 'accepted' ? 'accepted' : 'rejected'} your mentorship request`,
      link: `/mentorship/${mentorship._id}`
    });

    await mentorship.populate('mentee', 'name avatar');

    res.json({
      success: true,
      mentorship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's mentorships
// @route   GET /api/mentorship/my-mentorships
// @access  Private
exports.getMentorships = async (req, res) => {
  try {
    const { role } = req.query; // mentor or mentee

    const query = {
      status: { $in: ['accepted', 'active', 'completed'] }
    };

    if (role === 'mentor') {
      query.mentor = req.user._id;
    } else if (role === 'mentee') {
      query.mentee = req.user._id;
    } else {
      query.$or = [
        { mentor: req.user._id },
        { mentee: req.user._id }
      ];
    }

    const mentorships = await Mentorship.find(query)
      .populate('mentor', 'name avatar email currentCompany')
      .populate('mentee', 'name avatar email college')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      mentorships
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add mentorship session
// @route   POST /api/mentorship/:id/sessions
// @access  Private
exports.addSession = async (req, res) => {
  try {
    const { title, description, scheduledAt, duration } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check authorization
    const isAuthorized = mentorship.mentor.toString() === req.user._id.toString() ||
                        mentorship.mentee.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    mentorship.sessions.push({
      title,
      description,
      scheduledAt,
      duration,
      status: 'scheduled'
    });

    await mentorship.save();

    res.json({
      success: true,
      mentorship
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};