const Event = require('../models/Event');
const Community = require('../models/Community');
const Notification = require('../models/Notification');

exports.getEvents = async (req, res) => {
  try {
    const { communityId, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (communityId) query.community = communityId;
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate('creator', 'name avatar')
      .populate('community', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: 1 });

    const count = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name avatar role')
      .populate('community', 'name avatar')
      .populate('attendees.user', 'name avatar');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      community,
      eventType,
      startDate,
      endDate,
      maxAttendees,
      tags,
      isPublic,
      isPaid,
      price,
      locationType,
      locationVenue,
      locationAddress,
      locationCity,
      locationMeetingLink
    } = req.body;

    if (!title || !description || !community || !eventType || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required event fields' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

    const coverImage = req.file ? `/uploads/events/${req.file.filename}` : req.body.coverImage;

    const event = await Event.create({
      title,
      description,
      community,
      eventType,
      startDate,
      endDate,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      tags: parsedTags,
      isPublic: String(isPublic) !== 'false',
      isPaid: String(isPaid) === 'true',
      price: price ? Number(price) : undefined,
      coverImage,
      location: {
        type: locationType || 'online',
        venue: locationVenue,
        address: locationAddress,
        city: locationCity,
        meetingLink: locationMeetingLink
      },
      creator: req.user._id
    });

    await event.populate('creator', 'name avatar');

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const payload = { ...req.body };

    if (req.file) {
      payload.coverImage = `/uploads/events/${req.file.filename}`;
    }

    if (payload.tags && !Array.isArray(payload.tags)) {
      payload.tags = String(payload.tags).split(',').map(tag => tag.trim()).filter(Boolean);
    }

    event = await Event.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await event.deleteOne();

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isRegistered = event.attendees.some(
      a => a.user.toString() === req.user._id.toString()
    );

    if (isRegistered) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }

    event.attendees.push({ user: req.user._id });
    await event.save();

    res.json({ success: true, message: 'Successfully registered for event' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};