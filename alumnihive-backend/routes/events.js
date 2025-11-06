const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent,
  updateEvent, deleteEvent, registerForEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getEvents);
router.post('/', protect, createEvent);
router.get('/:id', protect, getEventById);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/register', protect, registerForEvent);

module.exports = router;