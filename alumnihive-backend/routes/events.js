const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent,
  updateEvent, deleteEvent, registerForEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { createImageUpload } = require('../middleware/upload');

const eventUpload = createImageUpload('events');

router.get('/', protect, getEvents);
router.post('/', protect, eventUpload.single('coverImage'), createEvent);
router.get('/:id', protect, getEventById);
router.put('/:id', protect, eventUpload.single('coverImage'), updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/register', protect, registerForEvent);

module.exports = router;