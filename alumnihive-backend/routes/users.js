const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, updateProfile,
  getMentors, becomeMentor, updateMentorApplication,
  getNotifications, markNotificationRead,
  updateProfilePhoto
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { createImageUpload } = require('../middleware/upload');

const profileUpload = createImageUpload('profile');

router.get('/', protect, getUsers);
router.get('/mentors', protect, getMentors);
router.post('/become-mentor', protect, becomeMentor);
router.put('/mentor-application', protect, updateMentorApplication);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);
router.put('/profile/photo', protect, profileUpload.single('avatar'), updateProfilePhoto);

module.exports = router;