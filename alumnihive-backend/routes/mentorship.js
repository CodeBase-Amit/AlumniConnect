const express = require('express');
const router = express.Router();
const {
  sendMentorshipRequest, getMentorshipRequests,
  respondToRequest, getMentorships, addSession
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, sendMentorshipRequest);
router.get('/requests', protect, getMentorshipRequests);
router.put('/requests/:id/respond', protect, respondToRequest);
router.get('/my-mentorships', protect, getMentorships);
router.post('/:id/sessions', protect, addSession);

module.exports = router;