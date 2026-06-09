const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const Notification = require('../models/Notification');

const ACTIVE_MENTORSHIP_STATUSES = ['accepted', 'active'];

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim().toLowerCase()).filter(Boolean);
  }

  return [];
};

const getMentorLoad = async (mentorId) => Mentorship.countDocuments({
  mentor: mentorId,
  status: { $in: ACTIVE_MENTORSHIP_STATUSES }
});

const getMentorCapacity = async (mentor) => {
  const activeCount = await getMentorLoad(mentor._id);
  const maxMentees = mentor.mentorDetails?.maxMentees || 5;

  return {
    activeCount,
    maxMentees,
    remainingSlots: Math.max(maxMentees - activeCount, 0),
    isFull: activeCount >= maxMentees
  };
};

const scoreMentor = (user, mentor) => {
  const userSkills = normalizeList(user.skills);
  const userInterests = normalizeList(user.interests);
  const mentorExpertise = normalizeList(mentor.mentorDetails?.expertise || []);
  const reasons = [];
  let score = 0;

  const skillMatches = mentorExpertise.filter((skill) => userSkills.includes(skill));
  if (skillMatches.length) {
    score += skillMatches.length * 25;
    reasons.push(`Shared skills: ${skillMatches.slice(0, 3).join(', ')}`);
  }

  const interestMatches = mentorExpertise.filter((skill) => userInterests.includes(skill));
  if (interestMatches.length) {
    score += interestMatches.length * 15;
    reasons.push(`Aligned interests: ${interestMatches.slice(0, 3).join(', ')}`);
  }

  if (user.department && mentor.department && user.department.toLowerCase() === mentor.department.toLowerCase()) {
    score += 10;
    reasons.push('Same department');
  }

  if (user.college && mentor.college && user.college.toLowerCase() === mentor.college.toLowerCase()) {
    score += 5;
    reasons.push('Same college');
  }

  return {
    score,
    reasons: reasons.length ? reasons : ['Available mentor match']
  };
};

// @desc    Send mentorship request
// @route   POST /api/mentorship/request
// @access  Private
exports.sendMentorshipRequest = async (req, res) => {
  try {
    const { mentorId, requestMessage, goals, skills } = req.body;

    const mentor = await User.findById(mentorId);

    if (!mentor || !mentor.isMentor || mentor.role !== 'alumni' || mentor.mentorDetails?.applicationStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    const capacity = await getMentorCapacity(mentor);
    if (capacity.isFull) {
      return res.status(400).json({
        success: false,
        message: 'This mentor is currently at capacity'
      });
    }

    const existingRequest = await Mentorship.findOne({
      mentor: mentorId,
      mentee: req.user._id,
      status: { $in: ['pending', 'accepted', 'active'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active mentorship request with this mentor'
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

    if (status === 'accepted') {
      const mentor = await User.findById(req.user._id);
      const capacity = await getMentorCapacity(mentor);

      if (capacity.isFull) {
        return res.status(400).json({
          success: false,
          message: 'You have reached your mentee limit'
        });
      }
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

// @desc    Get ranked mentor matches for students
// @route   GET /api/mentorship/matches
// @access  Private
exports.getMentorMatches = async (req, res) => {
  try {
    const { search, limit = 12 } = req.query;
    const currentUser = await User.findById(req.user._id);

    const mentors = await User.find({
      isMentor: true,
      role: 'alumni',
      isBlocked: false,
      'mentorDetails.applicationStatus': 'approved'
    })
      .select('name avatar bio role mentorDetails currentCompany currentPosition department skills interests college graduationYear')
      .sort({ createdAt: -1 });

    const searchTerm = `${search || ''}`.trim().toLowerCase();
    const matches = [];

    for (const mentor of mentors) {
      const capacity = await getMentorCapacity(mentor);
      if (capacity.isFull) {
        continue;
      }

      const { score, reasons } = scoreMentor(currentUser, mentor);
      const mentorText = [mentor.name, mentor.bio, mentor.currentPosition, mentor.currentCompany, ...(mentor.mentorDetails?.expertise || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (searchTerm && !mentorText.includes(searchTerm)) {
        continue;
      }

      matches.push({
        ...mentor.toObject(),
        matchScore: score,
        matchReasons: reasons,
        mentorCapacity: capacity
      });
    }

    matches.sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));

    res.json({
      success: true,
      mentors: matches.slice(0, Number.parseInt(limit, 10) || 12)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};