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
    const event = await Event.create({
      ...req.body,
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

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
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