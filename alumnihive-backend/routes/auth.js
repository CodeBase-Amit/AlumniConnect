const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../utils/validators');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

module.exports = router;