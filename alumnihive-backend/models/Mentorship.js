const mongoose = require('mongoose');

const MentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    required: [true, 'Please provide a request message']
  },
  goals: [String],
  skills: [String],
  sessions: [{
    title: String,
    description: String,
    scheduledAt: Date,
    duration: Number, // in minutes
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String,
    completedAt: Date
  }],
  feedback: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: Date,
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
MentorshipSchema.index({ mentor: 1, status: 1 });
MentorshipSchema.index({ mentee: 1, status: 1 });

module.exports = mongoose.model('Mentorship', MentorshipSchema);