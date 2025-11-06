const express = require('express');
const router = express.Router();
const {
  getQuestions, getQuestionById, createQuestion,
  addAnswer, voteQuestion, voteAnswer, acceptAnswer
} = require('../controllers/qaController');
const { protect } = require('../middleware/auth');
const { createQuestionValidation } = require('../utils/validators');

router.get('/', protect, getQuestions);
router.post('/', protect, createQuestionValidation, createQuestion);
router.get('/:id', protect, getQuestionById);
router.post('/:id/answers', protect, addAnswer);
router.post('/:id/vote', protect, voteQuestion);
router.post('/:questionId/answers/:answerId/vote', protect, voteAnswer);
router.post('/:questionId/answers/:answerId/accept', protect, acceptAnswer);

module.exports = router;