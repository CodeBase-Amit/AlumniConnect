const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestionBySlug,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  addAnswer,
  voteAnswer,
  acceptAnswer
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const createQuestionValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required'),
  body('category')
    .isIn(['technical', 'career', 'academic', 'general', 'other'])
    .withMessage('Invalid category')
];

// Public routes
router.get('/', getQuestions);
router.get('/:slug', getQuestionBySlug);

// Protected routes
router.post('/', protect, createQuestionValidation, createQuestion);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

// Voting
router.post('/:id/vote', protect, voteQuestion);

// Answers
router.post('/:id/answers', protect, addAnswer);
router.post('/:id/answers/:answerId/vote', protect, voteAnswer);
router.post('/:id/answers/:answerId/accept', protect, acceptAnswer);

module.exports = router;