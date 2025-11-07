const express = require('express');
const { protect, roleCheck } = require('../middleware/auth');
const {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getDashboardStats
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
});

router.get('/pending-approvals', getPendingApprovals);
router.post('/approve/:userId', approveUser);
router.post('/reject/:userId', rejectUser);
router.get('/stats', getDashboardStats);

module.exports = router;