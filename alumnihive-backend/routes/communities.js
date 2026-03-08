const express = require('express');
const router = express.Router();
const {
  getCommunities, getCommunityById, createCommunity,
  joinCommunity, leaveCommunity
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');
const { createCommunityValidation } = require('../utils/validators');
const { createImageUpload } = require('../middleware/upload');

const communityUpload = createImageUpload('communities');

router.get('/', protect, getCommunities);
router.post('/', protect, communityUpload.single('avatar'), createCommunityValidation, createCommunity);
router.get('/:id', protect, getCommunityById);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;