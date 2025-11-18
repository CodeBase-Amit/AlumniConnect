const { body, param, query } = require('express-validator');

// User validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('college').trim().notEmpty().withMessage('College is required'),
  body('role').isIn(['student', 'alumni']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Community validation
const createCommunityValidation = [
  body('name').trim().notEmpty().withMessage('Community name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['technology', 'career', 'hobby', 'academic', 'sports', 'arts', 'other'])
    .withMessage('Invalid category')
];

// Blog validation (combined & updated)
const createBlogValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required'),
  body('category')
    .isIn(['technology', 'career', 'education', 'lifestyle', 'other'])
    .withMessage('Invalid category'),
  body('excerpt')
    .optional()
    .isLength({ max: 300 }).withMessage('Excerpt cannot exceed 300 characters')
];

// Question validation
const createQuestionValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category')
    .isIn(['technical', 'career', 'academic', 'general', 'other'])
    .withMessage('Invalid category')
];

module.exports = {
  registerValidation,
  loginValidation,
  createCommunityValidation,
  createBlogValidation,
  createQuestionValidation
};
