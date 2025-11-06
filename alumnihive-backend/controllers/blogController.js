const Blog = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  try {
    const { search, category, tag, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (tag) query.tags = tag;

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar role')
      .select('-content')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publishedAt: -1 });

    const count = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      .populate('author', 'name avatar role bio')
      .populate('comments.user', 'name avatar')
      .populate('comments.replies.user', 'name avatar');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.views += 1;
    await blog.save();

    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, tags, category, communityId, isPublished } = req.body;

    const blog = await Blog.create({
      title,
      content,
      excerpt,
      tags,
      category,
      community: communityId,
      author: req.user._id,
      isPublished: isPublished || false,
      publishedAt: isPublished ? Date.now() : undefined
    });

    await blog.populate('author', 'name avatar');

    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('author', 'name avatar');

    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await blog.deleteOne();

    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const index = blog.likes.indexOf(req.user._id);

    if (index > -1) {
      blog.likes.splice(index, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({ success: true, likes: blog.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (parentId) {
      const comment = blog.comments.id(parentId);
      if (comment) {
        comment.replies.push({
          user: req.user._id,
          content
        });
      }
    } else {
      blog.comments.push({
        user: req.user._id,
        content
      });
    }

    await blog.save();
    await blog.populate('comments.user', 'name avatar');

    res.json({ success: true, comments: blog.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};