const Blog = require('../models/Blog');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const { search, category, author, page = 1, limit = 12 } = req.query;
    
    const query = { isPublished: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (author) {
      query.author = author;
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'name avatar role')
      .populate('community', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publishedAt: -1, createdAt: -1 });
    
    const count = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBlogs: count
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get my blogs (drafts + published)
// @route   GET /api/blogs/my/all
// @access  Private
exports.getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      blogs
    });
  } catch (error) {
    console.error('Get my blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name avatar email bio role currentCompany')  // ← Critical populate
      .populate('comments.user', 'name avatar')
      .populate('comments.replies.user', 'name avatar')
      .populate('community', 'name avatar');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { 
      title, 
      content, 
      excerpt, 
      coverImage, 
      tags, 
      category, 
      community,
      isPublished 
    } = req.body;
    
    const blog = await Blog.create({
      title,
      content,
      excerpt,
      coverImage,
      tags: tags || [],
      category,
      community,
      author: req.user.id,
      isPublished: isPublished || false,
      publishedAt: isPublished ? Date.now() : null
    });
    
    await blog.populate('author', 'name avatar email');
    
    res.status(201).json({
      success: true,
      message: isPublished ? 'Blog published successfully!' : 'Blog saved as draft!',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Author only)
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    if (blog.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    
    const { 
      title, 
      content, 
      excerpt, 
      coverImage, 
      tags, 
      category, 
      isPublished 
    } = req.body;
    
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.excerpt = excerpt || blog.excerpt;
    blog.coverImage = coverImage || blog.coverImage;
    blog.tags = tags || blog.tags;
    blog.category = category || blog.category;
    
    if (isPublished && !blog.isPublished) {
      blog.publishedAt = Date.now();
    }
    
    blog.isPublished = isPublished !== undefined ? isPublished : blog.isPublished;
    
    await blog.save();
    await blog.populate('author', 'name avatar email');
    
    res.json({
      success: true,
      message: 'Blog updated successfully!',
      blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Author only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    if (blog.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    
    await blog.deleteOne();
    
    res.json({
      success: true,
      message: 'Blog deleted successfully!'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like/Unlike blog
// @route   POST /api/blogs/:id/like
// @access  Private
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const isLiked = blog.likes.includes(req.user.id);
    
    if (isLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== req.user.id.toString());
    } else {
      blog.likes.push(req.user.id);
    }
    
    await blog.save();
    
    res.json({
      success: true,
      message: isLiked ? 'Blog unliked' : 'Blog liked',
      likes: blog.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add comment to blog
// @route   POST /api/blogs/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    blog.comments.push({
      user: req.user.id,
      content
    });
    
    await blog.save();
    await blog.populate('comments.user', 'name avatar');
    
    res.json({
      success: true,
      message: 'Comment added successfully!',
      comments: blog.comments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
