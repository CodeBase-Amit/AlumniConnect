const express = require('express');
const router = express.Router();
const {
  sendMentorshipRequest, getMentorshipRequests,
  respondToRequest, getMentorships, addSession,
  getMentorMatches, completeSession, updateSession, cancelSession,
  completeMentorship, addFeedback, rateMentee
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/auth');

router.post('/request', protect, sendMentorshipRequest);
router.get('/requests', protect, getMentorshipRequests);
router.put('/requests/:id/respond', protect, respondToRequest);
router.get('/my-mentorships', protect, getMentorships);
router.get('/matches', protect, getMentorMatches);
router.post('/:id/sessions', protect, addSession);
router.put('/:id/sessions/:sessionId', protect, updateSession);
router.put('/:id/sessions/:sessionId/complete', protect, completeSession);
router.put('/:id/sessions/:sessionId/cancel', protect, cancelSession);
router.put('/:id/complete', protect, completeMentorship);
router.post('/:id/feedback', protect, addFeedback);
router.post('/:id/rate-mentee', protect, rateMentee);

module.exports = router;