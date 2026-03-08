const express = require('express');
const router = express.Router();
const {
	getMessages,
	getPrivateMessages,
	deletePrivateMessage,
	bulkDeletePrivateMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/community/:communityId', protect, getMessages);
router.get('/private/:userId', protect, getPrivateMessages);
router.post('/private/bulk-delete', protect, bulkDeletePrivateMessages);
router.delete('/private/:messageId', protect, deletePrivateMessage);

module.exports = router;