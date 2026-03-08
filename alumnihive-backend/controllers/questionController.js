const Question = require('../models/Question');
const { validationResult } = require('express-validator');

// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
exports.getQuestions = async (req, res) => {
  try {
    const { search, category, tags, status, sort, page = 1, limit = 20 } = req.query;
    
    const query = { isBlocked: false };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    if (status) {
      query.status = status;
    }
    
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    if (sort === 'votes') {
      sortOption = { votes: -1 };
    } else if (sort === 'views') {
      sortOption = { views: -1 };
    } else if (sort === 'answers') {
      sortOption = { 'answers.length': -1 };
    }
    
    const questions = await Question.find(query)
      .populate('author', 'name avatar role')
      .populate('answers.author', 'name avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOption);
    
    const count = await Question.countDocuments(query);
    
    res.json({
      success: true,
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalQuestions: count
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get question by slug
// @route   GET /api/questions/:slug
// @access  Public
exports.getQuestionBySlug = async (req, res) => {
  try {
    const question = await Question.findOne({ slug: req.params.slug, isBlocked: false })
      .populate('author', 'name avatar email bio role')
      .populate('answers.author', 'name avatar role')
      .populate('answers.comments.author', 'name avatar');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Increment views
    question.views += 1;
    await question.save();
    
    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create question
// @route   POST /api/questions
// @access  Private
exports.createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { title, content, category, tags } = req.body;
    
    const question = await Question.create({
      title,
      content,
      category,
      tags: tags || [],
      author: req.user.id
    });
    
    await question.populate('author', 'name avatar email');
    
    res.status(201).json({
      success: true,
      message: 'Question posted successfully!',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Author only)
exports.updateQuestion = async (req, res) => {
  try {
    let question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check authorization
    if (question.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this question'
      });
    }
    
    const { title, content, category, tags } = req.body;
    
    question.title = title || question.title;
    question.content = content || question.content;
    question.category = category || question.category;
    question.tags = tags || question.tags;
    
    await question.save();
    await question.populate('author', 'name avatar email');
    
    res.json({
      success: true,
      message: 'Question updated successfully!',
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Author only)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check authorization
    if (question.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question'
      });
    }
    
    await question.deleteOne();
    
    res.json({
      success: true,
      message: 'Question deleted successfully!'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Vote question (upvote/downvote)
// @route   POST /api/questions/:id/vote
// @access  Private
exports.voteQuestion = async (req, res) => {
  try {
    const { voteType } = req.body; // 'up' or 'down'
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    const userId = req.user.id.toString();
    const hasUpvoted = question.upvotedBy.some(id => id.toString() === userId);
    const hasDownvoted = question.downvotedBy.some(id => id.toString() === userId);
    
    if (voteType === 'up') {
      if (hasUpvoted) {
        // Remove upvote
        question.upvotedBy = question.upvotedBy.filter(id => id.toString() !== userId);
        question.votes -= 1;
      } else {
        // Add upvote
        if (hasDownvoted) {
          question.downvotedBy = question.downvotedBy.filter(id => id.toString() !== userId);
          question.votes += 1;
        }
        question.upvotedBy.push(userId);
        question.votes += 1;
      }
    } else if (voteType === 'down') {
      if (hasDownvoted) {
        // Remove downvote
        question.downvotedBy = question.downvotedBy.filter(id => id.toString() !== userId);
        question.votes += 1;
      } else {
        // Add downvote
        if (hasUpvoted) {
          question.upvotedBy = question.upvotedBy.filter(id => id.toString() !== userId);
          question.votes -= 1;
        }
        question.downvotedBy.push(userId);
        question.votes -= 1;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }
    
    await question.save();
    
    res.json({
      success: true,
      votes: question.votes,
      hasUpvoted: question.upvotedBy.some(id => id.toString() === userId),
      hasDownvoted: question.downvotedBy.some(id => id.toString() === userId)
    });
  } catch (error) {
    console.error('Vote question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add answer
// @route   POST /api/questions/:id/answers
// @access  Private
exports.addAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Answer content is required'
      });
    }
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    question.answers.push({
      content,
      author: req.user.id
    });
    
    await question.save();
    await question.populate('answers.author', 'name avatar');
    
    res.json({
      success: true,
      message: 'Answer added successfully!',
      answers: question.answers
    });
  } catch (error) {
    console.error('Add answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Vote answer
// @route   POST /api/questions/:id/answers/:answerId/vote
// @access  Private
exports.voteAnswer = async (req, res) => {
  try {
    const { voteType } = req.body;
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    const answer = question.answers.id(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }
    
    const userId = req.user.id.toString();
    const hasUpvoted = answer.upvotedBy.some(id => id.toString() === userId);
    const hasDownvoted = answer.downvotedBy.some(id => id.toString() === userId);
    
    if (voteType === 'up') {
      if (hasUpvoted) {
        answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId);
        answer.votes -= 1;
      } else {
        if (hasDownvoted) {
          answer.downvotedBy = answer.downvotedBy.filter(id => id.toString() !== userId);
          answer.votes += 1;
        }
        answer.upvotedBy.push(userId);
        answer.votes += 1;
      }
    } else if (voteType === 'down') {
      if (hasDownvoted) {
        answer.downvotedBy = answer.downvotedBy.filter(id => id.toString() !== userId);
        answer.votes += 1;
      } else {
        if (hasUpvoted) {
          answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId);
          answer.votes -= 1;
        }
        answer.downvotedBy.push(userId);
        answer.votes -= 1;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }
    
    await question.save();
    
    res.json({
      success: true,
      votes: answer.votes,
      hasUpvoted: answer.upvotedBy.some(id => id.toString() === userId),
      hasDownvoted: answer.downvotedBy.some(id => id.toString() === userId)
    });
  } catch (error) {
    console.error('Vote answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept answer
// @route   POST /api/questions/:id/answers/:answerId/accept
// @access  Private (Question author only)
exports.acceptAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check if user is question author
    if (question.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only question author can accept answers'
      });
    }
    
    const answer = question.answers.id(req.params.answerId);
    
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }
    
    // Unaccept all other answers
    question.answers.forEach(ans => {
      ans.isAccepted = false;
    });
    
    // Accept this answer
    answer.isAccepted = true;
    
    await question.save();
    
    res.json({
      success: true,
      message: 'Answer accepted!',
      question
    });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};