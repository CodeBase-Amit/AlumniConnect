const mongoose = require('mongoose');
const slugify = require('slugify');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['technical', 'career', 'academic', 'general', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    votes: {
      type: Number,
      default: 0
    },
    upvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isAccepted: {
      type: Boolean,
      default: false
    },
    comments: [{
      content: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  votes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  isClosed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create slug before saving
questionSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  
  // Update status based on answers
  if (this.answers && this.answers.length > 0) {
    const hasAcceptedAnswer = this.answers.some(answer => answer.isAccepted);
    if (hasAcceptedAnswer) {
      this.status = 'answered';
    }
  }
  
  next();
});

module.exports = mongoose.model('Question', questionSchema);