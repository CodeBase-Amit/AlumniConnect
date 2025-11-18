const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
  addComment,
  getMyBlogs
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
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

// ⚠️ IMPORTANT: Order matters! Specific routes BEFORE parameterized routes
// Public routes
router.get('/', getBlogs);

// Protected routes - /my/all must come BEFORE /:slug
router.get('/my/all', protect, getMyBlogs);

// Blog CRUD
router.post('/', protect, createBlogValidation, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

// Like and Comment
router.post('/:id/like', protect, likeBlog);
router.post('/:id/comments', protect, addComment);

// Get blog by slug - MUST be last
router.get('/:slug', getBlogBySlug);

module.exports = router;