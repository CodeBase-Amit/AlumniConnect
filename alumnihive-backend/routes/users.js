const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, updateProfile,
  getMentors, becomeMentor,
  getNotifications, markNotificationRead
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.get('/mentors', protect, getMentors);
router.post('/become-mentor', protect, becomeMentor);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);

module.exports = router;