const express = require('express');
const router = express.Router();
const {
  getCommunities, getCommunityById, createCommunity,
  joinCommunity, leaveCommunity
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const { createCommunityValidation } = require('../utils/validators');

router.get('/', protect, getCommunities);
router.post('/', protect, createCommunityValidation, createCommunity);
router.get('/:id', protect, getCommunityById);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;