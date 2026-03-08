const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getDashboardStats,
  getUsers,
  blockUser,
  unblockUser,
  getContentList,
  toggleContentBlock,
  toggleContentFeature,
  markContent,
  getModerationLogs
} = require('../controllers/adminController');

const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@platform.admin').toLowerCase();

// All admin routes require admin role
router.use(protect);
router.use((req, res, next) => {
  const userEmail = req.user?.email ? req.user.email.toLowerCase() : '';
  if (req.user.role !== 'admin' || userEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
});

router.get('/pending-approvals', getPendingApprovals);
router.post('/approve/:userId', approveUser);
router.post('/reject/:userId', rejectUser);
router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.post('/users/:userId/block', blockUser);
router.post('/users/:userId/unblock', unblockUser);

router.get('/content/:type', getContentList);
router.post('/content/:type/:id/block', toggleContentBlock);
router.post('/content/:type/:id/feature', toggleContentFeature);
router.post('/content/:type/:id/mark', markContent);

router.get('/moderation-logs', getModerationLogs);

module.exports = router;