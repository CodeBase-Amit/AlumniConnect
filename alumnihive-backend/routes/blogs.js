const express = require('express');
const router = express.Router();
const {
  getBlogs, getBlogBySlug, createBlog, updateBlog,
  deleteBlog, likeBlog, addComment
} = require('../controllers/blogController');
const { protect, optionalAuth } = require('../middleware/auth');
const { createBlogValidation } = require('../utils/validators');

router.get('/', optionalAuth, getBlogs);
router.post('/', protect, createBlogValidation, createBlog);
router.get('/:slug', optionalAuth, getBlogBySlug);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, likeBlog);
router.post('/:id/comments', protect, addComment);

module.exports = router;