const Question = require('../models/Question');
const Notification = require('../models/Notification');

exports.getQuestions = async (req, res) => {
  try {
    const { search, category, tag, sort = 'recent', page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (tag) query.tags = tag;

    let sortQuery = { createdAt: -1 };
    if (sort === 'popular') sortQuery = { views: -1, 'upvotes.length': -1 };
    if (sort === 'unanswered') query['answers.0'] = { $exists: false };

    const questions = await Question.find(query)
      .populate('author', 'name avatar role')
      .select('-answers')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortQuery);

    const count = await Question.countDocuments(query);

    res.json({
      success: true,
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'name avatar role')
      .populate('answers.user', 'name avatar role')
      .populate('answers.comments.user', 'name avatar');

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question.views += 1;
    await question.save();

    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { title, content, tags, category, communityId } = req.body;

    const question = await Question.create({
      title,
      content,
      tags,
      category,
      community: communityId,
      author: req.user._id
    });

    await question.populate('author', 'name avatar');

    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question.answers.push({
      user: req.user._id,
      content
    });

    await question.save();
    await question.populate('answers.user', 'name avatar role');

    // Notify question author
    if (question.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: question.author,
        sender: req.user._id,
        type: 'answer',
        title: 'New Answer',
        message: `${req.user.name} answered your question`,
        link: `/questions/${question._id}`
      });
    }

    res.json({ success: true, answers: question.answers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.voteQuestion = async (req, res) => {
  try {
    const { voteType } = req.body; // upvote or downvote
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const upvoteIndex = question.upvotes.indexOf(req.user._id);
    const downvoteIndex = question.downvotes.indexOf(req.user._id);

    // Remove existing votes
    if (upvoteIndex > -1) question.upvotes.splice(upvoteIndex, 1);
    if (downvoteIndex > -1) question.downvotes.splice(downvoteIndex, 1);

    // Add new vote
    if (voteType === 'upvote') {
      question.upvotes.push(req.user._id);
    } else if (voteType === 'downvote') {
      question.downvotes.push(req.user._id);
    }

    await question.save();

    res.json({
      success: true,
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.voteAnswer = async (req, res) => {
  try {
    const { voteType } = req.body;
    const { questionId, answerId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const answer = question.answers.id(answerId);
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const upvoteIndex = answer.upvotes.indexOf(req.user._id);
    const downvoteIndex = answer.downvotes.indexOf(req.user._id);

    if (upvoteIndex > -1) answer.upvotes.splice(upvoteIndex, 1);
    if (downvoteIndex > -1) answer.downvotes.splice(downvoteIndex, 1);

    if (voteType === 'upvote') {
      answer.upvotes.push(req.user._id);
    } else if (voteType === 'downvote') {
      answer.downvotes.push(req.user._id);
    }

    await question.save();

    res.json({
      success: true,
      upvotes: answer.upvotes.length,
      downvotes: answer.downvotes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.acceptAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only question author can accept answers' });
    }

    // Unaccept all answers
    question.answers.forEach(ans => {
      ans.isAccepted = false;
    });

    // Accept the selected answer
    const answer = question.answers.id(answerId);
    if (answer) {
      answer.isAccepted = true;
      question.isSolved = true;
    }

    await question.save();

    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};